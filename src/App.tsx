import React, { useState } from "react";
import { Box, Text } from "ink";
import useList, { List, OnCmd, useIsFocus, useOnCmd } from "./List.js";
import useKeybinds from "@mmorrissey5961/ink-use-keybinds";
import { Item, initialItems, keybinds } from "./initialData.js";

export default function App(): React.ReactNode {
    const [items, setItems] = useState<Item[]>(initialItems);
    const [shoutout, setShoutout] = useState<string>("");
    const [ws, setWs] = useState<number>(5);
    // if (items.length < 10) {
    //     console.log(items.length);
    // }

    const { viewState, util } = useList(items.length, {
        windowSize: ws,
        centerScroll: false,
    });

    /* _____ DEBUG _____ */
    // console.log(`start: ${listWindow.start}`);
    // console.log(`end: ${listWindow.end}`);
    // console.log(`idx: ${listWindow.idx}`);
    // console.log(`listSize: ${listWindow.listSize}`);
    // console.log(`items.length: ${items.length}\n`);

    const itemNodes = items.map((desc, idx) => {
        return (isFocus: boolean, onCmd: OnCmd<typeof keybinds>) => {
            const color = isFocus ? "blue" : "";

            onCmd("toggleDone", () => {
                const copy = items.slice();
                copy[idx] = {
                    ...copy[idx],
                    completed: !copy[idx].completed,
                };
                setItems(copy);
            });

            onCmd("updateShoutout", () => {
                setShoutout(desc.id.slice(0, 5));
            });

            onCmd("deleteItem", () => {
                const copy = items.slice();
                copy.splice(idx, 1);
                setItems(copy.slice(2));
            });

            let cmpIcon = "";
            if (desc.completed) {
                cmpIcon = " ";
            }

            let focusCaret = " ";
            if (isFocus) {
                focusCaret = ">";
            }

            return (
                <Box key={desc.id} display="flex">
                    <Text
                        color={color}
                    >{`${focusCaret} This is item ${desc.id.slice(0, 5)}: ${desc.name}${cmpIcon}`}</Text>
                    <NestedListItem />
                </Box>
            );
        };
    });

    useKeybinds(keybinds, (cmd) => {
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

        if (cmd === "windowSize5") {
            util.modifyWinSize(5);
        }

        if (cmd === "windowSize10") {
            util.modifyWinSize(100);
        }
    });

    return (
        <>
            <Box>
                <Text>{`Last shoutout was: ${shoutout}`}</Text>
            </Box>
            <Box display="flex">
                <List
                    listItems={itemNodes}
                    viewState={viewState}
                    scrollBar={true}
                />
            </Box>
        </>
    );
}

function NestedListItem(): React.ReactNode {
    const [state, setState] = useState<number>(0);

    const onCmd = useOnCmd<typeof keybinds>();
    const isFocus = useIsFocus();

    const color = isFocus ? "blue" : "";

    onCmd("incSubCount", () => {
        setState(state + 1);
    });

    onCmd("decSubCount", () => {
        setState(state - 1);
    });

    return (
        <>
            <Text color={color}>{` ${state}`}</Text>
        </>
    );
}
