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
        { id: randomUUID(), name: "soda", completed: false },
        { id: randomUUID(), name: "raisin bran", completed: false },
        { id: randomUUID(), name: "capn crunch", completed: false },
        { id: randomUUID(), name: "cantelope", completed: false },
        { id: randomUUID(), name: "bread", completed: false },
        { id: randomUUID(), name: "frozen pizzas", completed: false },
        { id: randomUUID(), name: "candy", completed: false },
        { id: randomUUID(), name: "pasta", completed: false },
    ]);

    const items = descriptions.map((desc, idx) => {
        return (isFocus: boolean) => {
            const color = isFocus ? "blue" : "";

            function toggleDone() {
                const copy = descriptions.slice();
                copy[idx] = {
                    ...copy[idx],
                    completed: !copy[idx].completed,
                };
                setDescriptions(copy);
            }

            function sayBrodude() {
                console.log(`Ayo we at ${idx} and this is me saying brodude\n`);
            }

            function deleteItem() {
                const copy = descriptions.slice();
                copy.splice(idx, 1);
                setDescriptions(copy);
            }

            let cmpIcon = "";
            if (desc.completed) {
                cmpIcon = " ";
            }

            return (
                <ListItem
                    key={desc.id}
                    onCmd={{ toggleDone, sayBrodude, deleteItem }}
                >
                    <Box>
                        <Text
                            color={color}
                        >{`> This is item ${idx + 1}: ${desc.name}${cmpIcon}`}</Text>
                    </Box>
                </ListItem>
            );
        };
    });

    const { List, idx, incrementIdx, decrementIdx, goToIdx, emitter } = useList(
        items,
        {
            windowSize: 7,
        },
    );

    const kbs = {
        increment: [{ input: "j" }, { key: "downArrow" }],
        decrement: [{ input: "k" }, { key: "upArrow" }],
        goToTop: { input: "gg" },
        goToBottom: { input: "G" },
        toggleDone: { key: "return" },
        sayBrodude: [{ input: "bd" }, { input: "BD" }],
        deleteItem: { input: "dd" },
        scrollDown: { key: "ctrl", input: "d" },
        scrollUp: { key: "ctrl", input: "u" },
    } satisfies KbConfig;

    useKeybinds((cmd) => {
        if (cmd) {
            emitter.emit(cmd);
        }

        if (cmd === "increment") {
            incrementIdx();
        }

        if (cmd === "decrement") {
            decrementIdx();
        }

        if (cmd === "goToTop") {
            goToIdx(0);
        }

        if (cmd === "goToBottom") {
            goToIdx(items.length - 1);
        }
    }, kbs);

    return <List />;
}

type LIProps = PropsWithChildren & {
    onCmd?: { [key: string]: () => any };
    emitter?: EventEmitter;
};

function ListItem({ children, onCmd, emitter }: LIProps): React.ReactNode {
    if (emitter && onCmd) {
        Object.entries(onCmd).forEach((entry) => {
            const [cmd, on] = entry;
            emitter.on(cmd, on);
        });
    }

    return <>{children}</>;
}
