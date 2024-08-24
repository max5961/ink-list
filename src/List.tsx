import React, { useState, ReactNode, useRef, useEffect } from "react";
import { Box, measureElement } from "ink";
import { produce } from "immer";
import EventEmitter from "events";
import ScrollBar from "./Scrollbar.js";
import { KbConfig } from "@mmorrissey5961/ink-use-keybinds";
import { useContext, createContext } from "react";
import assert from "assert";
import { shallowEqualObjects } from "shallow-equal";

export type ULConfig = {
    windowSize?: number | null;
    keybinds?: { auto?: boolean; vi?: boolean };
    scrollBar?: boolean;
    centerScroll?: boolean;
    cmdHandler?: any;
    emitter?: EventEmitter;
};

export type ULState = {
    idx: number;
    start: number;
    end: number;
    __WIN_SIZE: number;
};

export type ViewState = {
    /* Used within the List component */
    start: number;
    end: number;
    idx: number;
    windowSize: number;
    itemsLength: number;

    /* Used with useKeybinds or useInput hook to emit a command that the ListItem
     * component can include a callback for */
    emitter: EventEmitter;
};

export type ListUtil = {
    idx: number;
    incrementIdx: () => void;
    decrementIdx: () => void;
    goToIdx: (n: number) => void;
    modifyWinSize: (n: number) => void;
    emitter: EventEmitter;
};

export default function useList(
    /* The amount of items to create a list for (the .length property).  NOT the last
     * index of of the items.  Rather than encapsulate this hook within the List
     * component, this gives more freedom to the user to utilize the list data at
     * the cost of some added complexity. */
    itemsLength: number,
    opts: ULConfig = {},
): { viewState: ViewState; util: ListUtil } {
    /* Set default opts but override if provided */
    opts = {
        windowSize: null,
        scrollBar: false,
        centerScroll: false,
        emitter: new EventEmitter(),
        ...opts,
    };
    opts.keybinds = opts.keybinds || { auto: true, vi: true };

    const [state, setState] = useState<ULState>({
        /* The index within the entire list of React Nodes */
        idx: 0,

        /* The index of the first element within the viewing window */
        start: 0,

        /* The index AFTER the last element within the viewing window */
        end: Math.min(opts.windowSize || itemsLength, itemsLength),

        /* This should only be modified through the modifyWinSize function in
         * order to keep the scrolling functions simple */
        __WIN_SIZE: opts.windowSize || itemsLength,
    });

    const LENGTH = itemsLength;
    const WINDOW_SIZE = Math.min(state.__WIN_SIZE || LENGTH, LENGTH);

    /* Entry point to modify window slice that always runs.  Any state change will
     * execute this function */
    handleScroll();

    function incrementIdx(): void {
        if (state.idx >= LENGTH - 1) return;

        handleScroll(state.idx + 1);
    }

    function decrementIdx(): void {
        if (state.idx <= 0) return;

        handleScroll(state.idx - 1);
    }

    function goToIdx(nextIdx: number): void {
        if (nextIdx > LENGTH - 1 || nextIdx < 0) return;
        handleScroll(nextIdx);
    }

    function handleScroll(nextIdx: number = state.idx): void {
        const nextState = opts.centerScroll
            ? getCenterScrollChanges(nextIdx)
            : getNormalScrollChanges(nextIdx);

        if (!shallowEqualObjects(state, nextState)) {
            setState(nextState);
        }
    }

    function modifyWinSize(nextSize: number): void {
        if (LENGTH === 0) return;

        const nextState = produce(state, (draft) => {
            nextSize = Math.abs(nextSize);
            nextSize = Math.min(nextSize, LENGTH);

            let target = nextSize - WINDOW_SIZE;
            while (target) {
                /* nextSize is greater than current size.  It is also impossible
                 * to slice the idx out of frame when increasing the window */
                if (target > 0) {
                    if (draft.end < LENGTH) {
                        ++draft.end;
                    } else if (draft.start > 0) {
                        --draft.start;
                    } else {
                        // For dev
                        assert(
                            false,
                            "Impossible case in modifyWinSize (inc win size)",
                        );
                    }

                    --target;
                } else {
                    /* Since we are decreasing the window size it is possible to
                     * cut the idx out of frame. Cut from bottom as long as possible
                     * without cutting idx out of frame, then cut from top. */
                    if (draft.idx < draft.end - 1) {
                        --draft.end;
                    } else if (draft.idx <= draft.end - 1) {
                        ++draft.start;
                    } else {
                        // For dev
                        assert(
                            false,
                            "Impossible case in modifyWinSize (dec win size)",
                        );
                    }

                    ++target;
                }
            }

            // For dev
            const msg = "idx out of range on window resize";
            assert(draft.idx < draft.end && draft.idx >= draft.start, msg);

            /* Just in case idx somehow gets out of frame after the resize */
            draft.idx = Math.min(draft.idx, draft.end - 1);
            draft.idx = Math.max(draft.idx, draft.start);
            draft.__WIN_SIZE = nextSize;
        });

        if (!shallowEqualObjects(state, nextState)) {
            setState(nextState);
        }
    }

    function getNormalScrollChanges(nextIdx: number): ULState {
        return produce(state, (draft) => {
            if (LENGTH === 0) return;
            if (
                (draft.start === 0 && draft.end === 0) ||
                draft.start === draft.end
            )
                return;

            const getTrueWindowSize = () => {
                return Math.min(LENGTH, draft.end) - draft.start;
            };

            let trueWindowSize = getTrueWindowSize();
            while (trueWindowSize < WINDOW_SIZE && trueWindowSize < LENGTH) {
                --draft.start;
                --draft.end;
                trueWindowSize = getTrueWindowSize();
            }

            draft.idx = Math.min(nextIdx, LENGTH - 1);
            draft.idx = Math.max(0, draft.idx);

            if (draft.idx === draft.end && draft.end < LENGTH) {
                ++draft.start;
                ++draft.end;
                return;
            }

            if (draft.idx === draft.start - 1 && draft.start > 0) {
                --draft.start;
                --draft.end;
                return;
            }
        });
    }

    function getCenterScrollChanges(nextIdx: number): ULState {
        const noIdxChange = nextIdx === state.idx;

        return produce(state, (draft) => {
            if (LENGTH === 0) return;
            if (draft.start === 0 && draft.end === 0) return;

            const getTrueWindowSize = () => {
                return Math.min(LENGTH, draft.end) - draft.start;
            };

            let trueWindowSize = getTrueWindowSize();
            while (trueWindowSize < WINDOW_SIZE && trueWindowSize < LENGTH) {
                --draft.start;
                --draft.end;
                trueWindowSize = getTrueWindowSize();
            }

            draft.idx = Math.min(nextIdx, LENGTH - 1);
            draft.idx = Math.max(0, draft.idx);
            const mid = Math.floor((draft.start + draft.end) / 2);

            if (noIdxChange) return;

            if (draft.idx > mid && draft.end !== LENGTH) {
                draft.start < LENGTH && ++draft.start;
                draft.end < LENGTH && ++draft.end;
                return;
            }

            if (draft.idx < mid && draft.start !== 0) {
                draft.start > 0 && --draft.start;
                draft.end > 0 && --draft.end;
                return;
            }
        });
    }

    const emitter = opts.emitter || new EventEmitter();

    /* This must be passed into the List component */
    const viewState = {
        /* Used within the List component */
        start: state.start,
        end: state.end,
        idx: state.idx,
        windowSize: WINDOW_SIZE,
        itemsLength,

        /* Used with useKeybinds or useInput hook to emit a command that the ListItem
         * component can include a callback for */
        emitter,
    };

    const util = {
        idx: state.idx,
        incrementIdx,
        decrementIdx,
        goToIdx,
        modifyWinSize,
        emitter,
    };

    return {
        viewState,
        util,
    };
}

interface ItemGen<T extends KbConfig = any> {
    (isFocus: boolean, onCmd: OnCmd<T>): React.ReactNode;
}

type ListProps<T extends KbConfig = any> = {
    listItems: ItemGen<T>[];
    viewState: ViewState;
    scrollBar?: boolean;
    centerScroll?: boolean;
};

export function List<T extends KbConfig = any>({
    listItems,
    viewState,
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
                if (idx !== viewState.idx) return;

                /* Make sure that on every re-render we are using the most recent
                 * handler which prevents stale closure as well as unneccessary
                 * listeners */
                viewState.emitter.removeAllListeners(args[0]);
                viewState.emitter.on(args[0], args[1]);
            };

            const node = item(idx === viewState.idx, onCmd);

            const key = (node as React.ReactElement).key;

            const isHidden = idx < viewState.start || idx >= viewState.end;

            return (
                <ListItem
                    key={key}
                    onCmd={onCmd}
                    isFocus={idx === viewState.idx}
                    emitter={viewState.emitter}
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
    }, [listItems, viewState]);

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
                <Box flexGrow={1}></Box>
            </Box>
            {scrollBar && (
                <ScrollBar
                    viewState={viewState}
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

const errMsg = (hook: string) => {
    return `It appears you are attempting to use the ${hook} hook outside the context of a List component (http://github.com/max5961/ink-list)`;
};
export function useListItemContext(): LIContext {
    const context = useContext(ListItemContext);
    assert(context, errMsg("useListItemContext"));
    return context;
}
export function useOnCmd<T extends object = any>(): OnCmd<T> {
    const context = useContext(ListItemContext);
    assert(context, errMsg("useOnCmd"));
    return context.onCmd;
}
export function useIsFocus(): boolean {
    const context = useContext(ListItemContext);
    assert(context, errMsg("useIsFocus"));
    return context.isFocus;
}
export function useListItemEmitter(): EventEmitter {
    const context = useContext(ListItemContext);
    assert(context, errMsg("useListItemEmitter"));
    return context.emitter;
}
