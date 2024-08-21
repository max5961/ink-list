import React, { useState } from "react";
import { Box, Text } from "ink";
import useList, { List } from "./List.js";
import useKeybinds from "@mmorrissey5961/ink-use-keybinds";
import { ListItem } from "./List.js";
import { Item, initialItems, keybinds } from "./initialData.js";

export default function App(): React.ReactNode {
    const [items, setItems] = useState<Item[]>(initialItems);
    const [shoutout, setShoutout] = useState<string>("");
    const [left, setLeft] = useState(true);

    const { listWindow, util } = useList(items.length, { windowSize: 5 });

    /* _____ DEBUG _____ */
    // console.log(`start: ${listWindow.start}`);
    // console.log(`end: ${listWindow.end}`);
    // console.log(`idx: ${listWindow.idx}`);
    // console.log(`listSize: ${listWindow.listSize}`);
    // console.log(`items.length: ${items.length}\n`);

    const itemNodes = items.map((desc, idx) => {
        return (isFocus: boolean) => {
            const color = isFocus ? "blue" : "";

            function toggleDone() {
                const copy = items.slice();
                copy[idx] = {
                    ...copy[idx],
                    completed: !copy[idx].completed,
                };
                setItems(copy);
            }

            function updateShoutout() {
                setShoutout(desc.id.slice(0, 5));
            }

            function deleteItem() {
                const copy = items.slice();
                copy.splice(idx, 1);
                setItems(copy);
            }

            let cmpIcon = "";
            if (desc.completed) {
                cmpIcon = " ";
            }

            return (
                <ListItem
                    key={desc.id}
                    onCmd={{ toggleDone, updateShoutout, deleteItem }}
                >
                    <Box>
                        <Text
                            color={color}
                        >{`> This is item ${desc.id.slice(0, 5)}: ${desc.name}${cmpIcon}`}</Text>
                    </Box>
                </ListItem>
            );
        };
    });

    useKeybinds((cmd) => {
        if (cmd) {
            left && util.emitter.emit(cmd);
        }

        if (cmd === "increment") {
            left && util.incrementIdx();
        }

        if (cmd === "decrement") {
            left && util.decrementIdx();
        }

        if (cmd === "goToTop") {
            left && util.goToIdx(0);
        }

        if (cmd === "goToBottom") {
            left && util.goToIdx(items.length - 1);
        }
    }, keybinds);

    return (
        <>
            <Box>
                <Text>{`Last shoutout was: ${shoutout}`}</Text>
            </Box>
            <Box display="flex">
                <List
                    listItems={itemNodes}
                    listWindow={listWindow}
                    scrollBar={true}
                />
            </Box>
        </>
    );
}
