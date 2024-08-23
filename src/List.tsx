import React, { useState, ReactNode, useRef, useEffect } from "react";
import { Box, measureElement } from "ink";
import { produce } from "immer";
import EventEmitter from "events";
import ScrollBar from "./Scrollbar.js";
import deepEqual from "deep-equal";
import { KbConfig } from "@mmorrissey5961/ink-use-keybinds";
import { useContext, createContext } from "react";
import assert from "assert";

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

interface ItemGen<T extends KbConfig = any> {
    (isFocus: boolean, onCmd: OnCmd<T>): React.ReactNode;
}

type ListProps<T extends KbConfig = any> = {
    listItems: ItemGen<T>[];
    listWindow: ListWindow;
    scrollBar?: boolean;
    scrollMiddle?: boolean;
};

export function List<T extends KbConfig = any>({
    listItems,
    listWindow,
    scrollBar = true,
}: ListProps<T>): ReactNode {
    const [hw, setHw] = useState<{ height: number; width: number }>({
        height: 0,
        width: 0,
    });

    const ref = useRef();

    const generatedItems: ReactNode[] = listItems
        // Create the nodes
        .map((item: ItemGen, idx: number) => {
            const onCmd: OnCmd<T> = (...args: Parameters<OnCmd>) => {
                if (idx !== listWindow.idx) return;

                /* Make sure that on every re-render we are using the most recent
                 * handler which prevents stale closure as well as  unneccessary
                 * listeners that will lead to max listener warnings */
                listWindow.emitter.removeAllListeners(args[0]);
                listWindow.emitter.on(args[0], args[1]);
            };

            const node = item(idx === listWindow.idx, onCmd);

            const key = (node as React.ReactElement).key;

            const isHidden = idx < listWindow.start || idx >= listWindow.end;

            return (
                <ListItem
                    key={key}
                    onCmd={onCmd}
                    isFocus={idx === listWindow.idx}
                    emitter={listWindow.emitter}
                    isHidden={isHidden}
                >
                    {node}
                </ListItem>
            );
        });

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
                    {generatedItems}
                </Box>
                <Box flexGrow={1}></Box>;
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

export type OnCmd<T extends object = any> = (
    cmd: T extends object
        ? keyof T extends string | symbol
            ? keyof T
            : never
        : string,
    handler: (...args: any[]) => any,
) => void;

type LIProps<T extends KbConfig = any> = React.PropsWithChildren & {
    isFocus: boolean;
    onCmd: OnCmd<T>;
    emitter: EventEmitter;
    isHidden?: boolean;
};

type LIContext<T extends KbConfig = any> = {
    onCmd: OnCmd<T>;
    isFocus: boolean;
    emitter: EventEmitter;
};

const ListItemContext = createContext<LIContext | null>(null);

export function ListItem<T extends KbConfig = any>({
    children,
    onCmd,
    emitter,
    isFocus,
    isHidden = false,
}: LIProps<T>): React.ReactNode {
    return (
        <ListItemContext.Provider
            value={{
                isFocus,
                onCmd,
                emitter,
            }}
        >
            {isHidden ? (
                <Box height={0} width={0} overflow="hidden">
                    {children}
                </Box>
            ) : (
                <Box>{children}</Box>
            )}
        </ListItemContext.Provider>
    );
}

export function useListItemContext(): LIContext {
    const context = useContext(ListItemContext);

    const errMsg =
        "It appears that you are attempting to use ListItemContext outside the context of the List component";
    assert(context, errMsg);

    return context;
}

export function useOnCmd<T extends object = any>(): OnCmd<T> {
    const context = useListItemContext();
    return context.onCmd;
}

export function useIsFocus(): boolean {
    const context = useListItemContext();
    return context.isFocus;
}

export function useListItemEmitter(): EventEmitter {
    const context = useListItemContext();
    return context.emitter;
}
