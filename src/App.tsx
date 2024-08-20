import React, { PropsWithChildren, ReactNode, useState } from "react";
import { Box, Text } from "ink";
import useList from "./List.js";
import useKeybinds, { KbConfig } from "@mmorrissey5961/ink-use-keybinds";
import EventEmitter from "events";
import { randomUUID } from "crypto";

type Item = {
    id: string;
    name: string;
    completed: boolean;
};

export default function App(): React.ReactNode {
    const [descriptions, setDescriptions] = useState<Item[]>([
        { id: randomUUID(), name: "apple", completed: false },
        { id: randomUUID(), name: "banana", completed: false },
        { id: randomUUID(), name: "pear", completed: false },
        { id: randomUUID(), name: "milk", completed: false },
        { id: randomUUID(), name: "eggs", completed: false },
        { id: randomUUID(), name: "cereal", completed: false },
        { id: randomUUID(), name: "watermelon", completed: false },
        { id: randomUUID(), name: "pizza", completed: false },
        { id: randomUUID(), name: "ice cream", completed: false },
        { id: randomUUID(), name: "chips", completed: false },
    ]);

    const items = descriptions.map((desc, idx) => {
        return (isFocus: boolean) => {
            const color = isFocus ? "blue" : "";

            function onCmd() {
                const copy = descriptions.slice();
                copy[idx] = { ...copy[idx], completed: !copy[idx].completed };
                setDescriptions(copy);
            }

            let cmpIcon = "";
            if (desc.completed) {
                cmpIcon = " ";
            }

            return (
                <ListItem key={desc.id} cmd="return" onCmd={onCmd}>
                    <Box>
                        <Text
                            color={color}
                        >{`> This is item ${idx + 1}: ${desc.name}${cmpIcon}`}</Text>
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
