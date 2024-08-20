import React, { useState, useEffect, ReactNode } from "react";
import { Box } from "ink";
import { produce } from "immer";
import useKeybinds from "@mmorrissey5961/ink-use-keybinds";
import EventEmitter from "events";

/* Create a hook called 'useList' that returns a List component along with other
 * information which could be considered useful such as idx */

type WindowState = {
    start: number;
    end: number;
    mid: number;
    windowSize: number;
};

type ULConfig = {
    windowSize?: number | null;
    scrollBar?: boolean;
    scrollMiddle?: boolean;
};

type ULState = {
    idx: number;
    start: number;
    end: number;
    mid: number;
};

/* Returns a built List of items along with incrementIdx(), decrementIdx(), and
 * idx */

export default function useList(
    items: ((isFocus: boolean) => ReactNode)[],
    config: ULConfig = {
        windowSize: null,
        scrollBar: false,
        scrollMiddle: false,
    },
) {
    const MAX_INDEX = items.length - 1;
    const WINDOW_SIZE = config.windowSize || MAX_INDEX;

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

    /* These are simple functions but need to trigger more complex operations that
     * handle the transforming window size as a result of the increment/decrement */
    function incrementIdx(): void {
        if (state.idx >= MAX_INDEX) return;
        handleIdxChanges(state, state.idx + 1);
    }

    function decrementIdx(): void {
        if (state.idx <= 0) return;
        handleIdxChanges(state, state.idx - 1);
    }

    function handleIdxChanges(state: ULState, nextIdx: number) {
        const nextState = produce(state, (draft) => {
            draft.idx = nextIdx;

            if (draft.idx === draft.end) {
                ++draft.start;
                ++draft.end;
            }

            if (draft.idx === draft.start - 1) {
                --draft.start;
                --draft.end;
            }
        });

        setState(nextState);
    }

    const emitter = new EventEmitter();

    useKeybinds(
        (cmd) => {
            if (cmd === "return") {
                emitter.emit(cmd);
            }
        },
        { return: { key: "return" } },
    );

    const slicedItems: ReactNode[] = items
        .map((item, idx) => {
            const node = item(idx === state.idx) as React.ReactElement;
            if (idx === state.idx) {
                const clonedNode = React.cloneElement(node, {
                    emitter,
                });
                return clonedNode;
            } else {
                return node;
            }
        })
        .slice(state.start, state.end);

    const list = () => <List items={slicedItems} />;

    return {
        List: list,
        idx: state.idx,
        incrementIdx,
        decrementIdx,
    };
}

type ListProps = {
    items: React.ReactNode[] | React.ReactElement[];
    windowSize?: number;
    scrollBar?: boolean;
    scrollMiddle?: boolean;
};

export function List({
    items,
    scrollBar = true,
    scrollMiddle = false,
}: ListProps): ReactNode {
    return <>{items}</>;
}
