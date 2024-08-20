import React, { PropsWithChildren, ReactNode } from "react";
import { Box, Text } from "ink";
import useList from "./List.js";
import useKeybinds, { KbConfig } from "@mmorrissey5961/ink-use-keybinds";
import EventEmitter from "events";

export default function App(): React.ReactNode {
    const tcs: number[] = [];
    for (let i = 0; i < 21; ++i) {
        tcs.push(i);
    }

    const items = tcs.map((i) => {
        return (isFocus: boolean) => {
            const color = isFocus ? "blue" : "";

            return (
                <ListItem
                    key={i}
                    cmd="return"
                    onCmd={() => console.log(`Event for item: ${i}`)}
                >
                    <Box>
                        <Text color={color}>{`> This is item: ${i}`}</Text>
                    </Box>
                </ListItem>
            );
        };
    });

    /* It appears we have a bit of a snafu!  Idx is generated from the items
     * argument, but each item needs to know their idx so they can highlight! */
    const { List, incrementIdx, decrementIdx, idx } = useList(items, {
        windowSize: 5,
    });

    const kbs = {
        increment: [{ input: "j" }, { key: "downArrow" }],
        decrement: [{ input: "k" }, { key: "upArrow" }],
        enter: { key: "return" },
    } satisfies KbConfig;

    useKeybinds((cmd) => {
        if (cmd === "increment") {
            incrementIdx();
        }

        if (cmd === "decrement") {
            decrementIdx();
        }
    }, kbs);

    return <List />;
}

type LIProps = PropsWithChildren & {
    onCmd?: () => void;
    cmd?: string;
    emitter?: EventEmitter;
};

function ListItem({ children, onCmd, cmd, emitter }: LIProps): React.ReactNode {
    if (emitter && cmd && onCmd) {
        emitter.on(cmd, onCmd);
    }

    return <>{children}</>;
}
