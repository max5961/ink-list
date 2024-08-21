import React, { useState } from "react";
import { Box, Text } from "ink";
import useList, { List } from "./List.js";
import useKeybinds from "@mmorrissey5961/ink-use-keybinds";
import { ListItem } from "./List.js";
import { Item, initialItems, keybinds } from "./initialData.js";

export default function App(): React.ReactNode {
    const [items, setItems] = useState<Item[]>(initialItems);
    const [shoutout, setShoutout] = useState<string>("");

    const { listWindow, util } = useList(items.length, { windowSize: 5 });

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
            util.emitter.emit(cmd);
        }

        if (cmd === "increment") {
            util.incrementIdx();
        }

        if (cmd === "decrement") {
            util.decrementIdx();
        }

        if (cmd === "goToTop") {
            util.goToIdx(0);
        }

        if (cmd === "goToBottom") {
            util.goToIdx(items.length - 1);
        }
    }, keybinds);

    return (
        <>
            <Box>
                <Text>{`Last shoutout was: ${shoutout}`}</Text>
            </Box>
            <List
                listItems={itemNodes}
                listWindow={listWindow}
                scrollBar={true}
            />
        </>
    );
}
