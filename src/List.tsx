import React, {
    useState,
    ReactNode,
    useRef,
    useEffect,
    LegacyRef,
    MutableRefObject,
} from "react";
import { Box, DOMElement, measureElement, Text } from "ink";
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
    keybinds?: { auto?: boolean; vi?: boolean };
    scrollBar?: boolean;
    scrollMiddle?: boolean;
    cmdHandler?: any;
    emitter?: EventEmitter;
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
    opts: ULConfig = {},
) {
    /* Set default opts but override if provided */
    // opts = { trackState: false, ...opts };
    opts = {
        windowSize: null,
        scrollBar: false,
        scrollMiddle: false,
        emitter: new EventEmitter(),
        ...opts,
    };
    opts.keybinds = opts.keybinds || { auto: true, vi: true };

    const MAX_INDEX = items.length - 1;
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

    function incrementIdx(): void {
        if (state.idx >= MAX_INDEX) return;
        handleIdxChanges(state, state.idx + 1);
    }

    function decrementIdx(): void {
        if (state.idx <= 0) return;
        handleIdxChanges(state, state.idx - 1);
    }

    function goToIdx(nextIdx: number): void {
        if (nextIdx > MAX_INDEX || nextIdx < 0) return;
        handleIdxChanges(state, nextIdx);
    }

    function handleIdxChanges(state: ULState, nextIdx: number) {
        const nextState = produce(state, (draft) => {
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

            // handle set idx out of window range
            if (draft.idx > draft.end) {
                while (draft.idx >= draft.end && draft.end <= MAX_INDEX) {
                    ++draft.start;
                    ++draft.end;
                }
                return;
            }

            if (draft.idx < draft.start) {
                while (draft.idx < draft.start && draft.start >= 0) {
                    --draft.start;
                    --draft.end;
                }
            }
        });

        setState(nextState);
    }

    const emitter = opts.emitter || new EventEmitter();

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

    const list = () => (
        <List
            items={slicedItems}
            window={{
                start: state.start,
                mid: state.mid,
                end: state.end,
                windowSize: WINDOW_SIZE,
                length: items.length,
            }}
        />
    );

    return {
        /* The List component contains the sliced window of the items */
        List: list,

        /* Used with useKeybinds or useInput hook to emit a command that the ListItem
         * component can include a callback for */
        emitter,

        /* The current index of the entire list of of ListItems*/
        idx: state.idx,

        /* If chosen to not use the default keybinds, modify the focus and window
         * slice outside of this hook */
        incrementIdx,
        decrementIdx,
        goToIdx,
    };
}

type ListProps = {
    items: React.ReactNode[] | React.ReactElement[];
    window: {
        start: number;
        mid: number;
        end: number;
        windowSize: number;
        length: number;
    };
    scrollBar?: boolean;
    scrollMiddle?: boolean;
};

/* The pattern of returning the entirely built List every time means we are doing
 * a re-render of the entire List on every state change which is a problem */
export function List({
    items,
    window,
    scrollBar = true,
    scrollMiddle = false,
}: ListProps): ReactNode {
    const ref = useRef();

    const dim = { height: 0, width: 0 };

    useEffect(() => {
        const { width, height } = measureElement(ref.current as any);
        dim.height = height;
        dim.width = width;
        // console.log(`width: ${width}, height: ${height}`);
    }, []);

    return (
        <Box
            flexDirection="row"
            ref={ref as any}
            borderStyle="round"
            justifyContent="space-between"
            width="50%"
        >
            <Box flexDirection="column">{items}</Box>
            {scrollBar && <ScrollBar window={window} dim={dim} />}
        </Box>
    );
}

function ScrollBar({
    window,
    dim,
}: Pick<ListProps, "window"> & {
    dim: { height: number; width: number };
}): React.ReactNode {
    // console.log(dim);
    const { start, mid, end, windowSize, length } = window;
    // windowSize / length gets the relative percentage of the window to all items
    // line height * (windowSize / length) gets the lines the bar should take up

    const barHeight = Math.ceil(7 * (windowSize / length));

    // midIdx is used to determine if we should round up or down for the start/end padding
    //
    // if start is less than midIdx we want to make sure it rounds down so that
    // we don't get any gaps we don't want at the start
    //
    // if end is greater than midIdx we want to make sure it rounds down, for the
    // same reason as start
    const midIdx = Math.floor(windowSize / 2);

    const preStart = 7 * (start / length);
    const preEnd = 7 * ((length - end) / length);

    const startHeight = Math.floor(preStart);
    const endHeight = Math.floor(preEnd);

    // console.log(`${startHeight}, ${barHeight}, ${endHeight}`);

    return (
        <>
            <Box flexDirection="column" height="100%" paddingRight={1}>
                {new Array(startHeight).fill(0).map((_, idx) => {
                    return <Text key={idx}> </Text>;
                })}
                {new Array(barHeight).fill(0).map((_, idx) => {
                    // prettier-ignore
                    return <Text key={idx} backgroundColor="blue"> </Text>;
                })}
                {new Array(endHeight).fill(0).map((_, idx) => {
                    return <Text key={idx}> </Text>;
                })}
            </Box>
        </>
    );
}
