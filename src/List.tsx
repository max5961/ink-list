import React, { useState, ReactNode, useRef, useEffect } from "react";
import { Box, measureElement } from "ink";
import { produce } from "immer";
import EventEmitter from "events";
import ScrollBar from "./Scrollbar.js";
import * as _ from "lodash";
import deepEqual from "deep-equal";

export type ULConfig = {
    windowSize?: number | null;
    keybinds?: { auto?: boolean; vi?: boolean };
    scrollBar?: boolean;
    scrollMiddle?: boolean;
    cmdHandler?: any;
    emitter?: EventEmitter;
};

export type ULState = {
    idx: number;
    start: number;
    end: number;
    mid: number;
};

export type ListWindow = {
    /* Used within the List component */
    start: number;
    mid: number;
    end: number;
    idx: number;
    windowSize: number;
    listSize: number;

    /* Used with useKeybinds or useInput hook to emit a command that the ListItem
     * component can include a callback for */
    emitter: EventEmitter;
};

export type ListUtil = {
    idx: number;
    incrementIdx: () => void;
    decrementIdx: () => void;
    goToIdx: (n: number) => void;
    emitter: EventEmitter;
};

let idx = -1;
export default function useList(
    /* The amount of items to create a list for (the .length property).  NOT the last
     * index of of the items.  Rather than encapsulate this hook within the List
     * component, this gives more freedom to the user to utilize the list data at
     * the cost of some added complexity. */
    listSize: number,
    opts: ULConfig = {},
): { listWindow: ListWindow; util: ListUtil } {
    /* Set default opts but override if provided */
    opts = {
        windowSize: null,
        scrollBar: false,
        scrollMiddle: false,
        emitter: new EventEmitter(),
        ...opts,
    };
    opts.keybinds = opts.keybinds || { auto: true, vi: true };

    const MAX_INDEX = listSize - 1;
    const WINDOW_SIZE = opts.windowSize || MAX_INDEX + 1;

    const windowState = {
        /* The index within the entire list of React Nodes */
        idx: 0,

        /* The index of the first element within the viewing window */
        start: 0,

        /* The index of the last element within the viewing window */
        end: WINDOW_SIZE,

        /* The index of the middle element between the start and end indexes */
        mid: Math.floor(WINDOW_SIZE / 2),
    };

    const [state, setState] = useState<ULState>(windowState);
    // console.log(`${state.end}, ${MAX_INDEX}`);

    /* Entry point to modify window slice that always runs, so this runs on every
     * state change made to the component that calls this hook.  It slices the
     * input array from start to (but not including) end */
    if (state.idx < 0) {
        handleIdxChanges(0);
    } else {
        handleIdxChanges();
    }

    function incrementIdx(): void {
        if (state.idx >= MAX_INDEX) return;
        handleIdxChanges(state.idx + 1);
    }

    function decrementIdx(): void {
        if (state.idx <= 0) return;
        handleIdxChanges(state.idx - 1);
    }

    function goToIdx(nextIdx: number): void {
        if (nextIdx > MAX_INDEX || nextIdx < 0) return;
        handleIdxChanges(nextIdx);
    }

    if (state.idx > MAX_INDEX && listSize !== 0) {
        handleIdxChanges();
    }

    if (state.idx < 0) {
        handleIdxChanges(0);
    }

    function handleIdxChanges(nextIdx: number = state.idx) {
        const nextState = produce(state, (draft) => {
            if (draft.start === 0 && draft.end === 0) {
                return;
            }

            // This solves the issue, but shortens the list when deleting last
            // item in the list when that shortens the slice to WINDOW_SIZE
            if (draft.end > listSize && listSize > WINDOW_SIZE) {
                while (draft.end > listSize && draft.start > 0) {
                    --draft.end;
                    --draft.start;
                    --draft.idx;
                }
                return;
            }

            // if (draft.end > listSize && listSize < )

            draft.idx = nextIdx;

            if (draft.idx === draft.end) {
                ++draft.start;
                ++draft.end;
                return;
            }

            if (draft.idx === draft.start - 1) {
                --draft.start;
                --draft.end;
                return;
            }

            // handle set idx out of list range (deleting items at the end of the list)
            if (draft.idx > MAX_INDEX) {
                while (draft.idx > MAX_INDEX) {
                    --draft.idx;
                    --draft.end;
                    draft.start - 1 >= 0 && --draft.start;
                }
                return;
            }

            // handle set idx greater than window range
            if (draft.idx > draft.end) {
                while (draft.idx >= draft.end && draft.end <= MAX_INDEX) {
                    ++draft.start;
                    ++draft.end;
                }
                return;
            }

            // handle set idx less than window range
            if (draft.idx < draft.start) {
                while (draft.idx < draft.start && draft.start >= 0) {
                    --draft.start;
                    --draft.end;
                }
            }

            // This causes an infinite loop somehow
            // while (draft.end > MAX_INDEX && draft.start > 0) {
            //     --draft.end;
            //     --draft.start;
            // }
            // // handle window gets cut short
            // const currSize = draft.end - draft.start;
            // // currSize is NEVER getting smaller except at end
            // // console.log(currSize);
            // if (currSize < WINDOW_SIZE) {
            //     while (draft.end + 1 <= MAX_INDEX && currSize < WINDOW_SIZE) {
            //         ++draft.end;
            //     }
            //
            //     while (draft.start - 1 >= 0 && currSize < WINDOW_SIZE) {
            //         --draft.start;
            //     }
            // }
        });

        if (!deepEqual(state, nextState)) {
            setState(nextState);
        }
    }

    const emitter = opts.emitter || new EventEmitter();

    /* This must be passed into the List component */
    const listWindow = {
        /* Used within the List component */
        start: state.start,
        mid: state.mid,
        end: state.end,
        idx: state.idx,
        windowSize: WINDOW_SIZE,
        listSize,

        /* Used with useKeybinds or useInput hook to emit a command that the ListItem
         * component can include a callback for */
        emitter,
    };

    const util = {
        idx: state.idx,
        incrementIdx,
        decrementIdx,
        goToIdx,
        emitter,
    };

    return {
        listWindow,
        util,
    };
}

type ListProps = {
    listItems: ((isFocus: boolean) => React.ReactNode)[];
    listWindow: ListWindow;
    scrollBar?: boolean;
    scrollMiddle?: boolean;
};

export function List({
    listItems,
    listWindow,
    scrollBar = true,
    scrollMiddle = false,
}: ListProps): ReactNode {
    const [hw, setHw] = useState<{ height: number; width: number }>({
        height: 0,
        width: 0,
    });

    const ref = useRef();

    const slicedItems: ReactNode[] = listItems
        // Create the nodes
        .map((item, idx) => {
            const node = item(idx === listWindow.idx) as React.ReactElement;

            if (idx === listWindow.idx) {
                const clonedNode = React.cloneElement(node, {
                    _emitter: listWindow.emitter,
                });
                return clonedNode;
            } else {
                return node;
            }
        })

        // Slice according to window dimensions
        .slice(listWindow.start, listWindow.end);

    useEffect(() => {
        if (scrollBar) {
            const { width, height } = measureElement(ref.current as any);
            setHw({ height, width });
        }
    }, [listItems, listWindow]);

    return (
        <Box
            flexDirection="row"
            borderStyle="round"
            justifyContent="space-between"
            width="50%"
        >
            <Box display="flex" flexDirection="column">
                <Box flexShrink={1} flexDirection="column" ref={ref as any}>
                    {slicedItems}
                </Box>
                <Box flexGrow={1}></Box>
            </Box>
            {scrollBar && (
                <ScrollBar
                    listWindow={listWindow}
                    height={hw.height}
                    width={hw.width}
                />
            )}
        </Box>
    );
}

type LIProps = React.PropsWithChildren & {
    onCmd?: { [key: string]: () => any };
    _emitter?: EventEmitter;
};

export function ListItem({
    children,
    onCmd,
    _emitter,
}: LIProps): React.ReactNode {
    if (_emitter && onCmd) {
        Object.entries(onCmd).forEach((entry) => {
            const [cmd, on] = entry;
            _emitter.on(cmd, on);
        });
    }

    return <>{children}</>;
}
