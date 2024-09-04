import React, { useState } from "react";
import { Box, Text } from "ink";
import useList, { List, OnCmd, useIsFocus, useOnCmd } from "./List.js";
import useKeybinds from "@mmorrissey5961/ink-use-keybinds";
import { Item, initialItems, keybinds } from "./initialData.js";

export default function App(): React.ReactNode {
    const [items, setItems] = useState<Item[]>(initialItems);
    const [shoutout, setShoutout] = useState<string>("");

    const { viewState, util } = useList(items.length, {
        windowSize: 5,
        centerScroll: true,
    });

    /* _____ DEBUG _____ */
    // console.log(`start: ${viewState._start}`);
    // console.log(`end: ${viewState._end}`);
    // console.log(`idx: ${viewState._idx}`);
    // console.log(`listSize: ${viewState._listSize}`);
    // console.log(`items.length: ${items.length}\n`);

    const itemGenerators = items.map((desc, idx) => {
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
                setItems(copy);
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
                    >{`${focusCaret} item ${desc.id.slice(0, 5)}: ${desc.name}${cmpIcon}`}</Text>
                    <NestedListItem />
                </Box>
            );
        };
    });

    useKeybinds(keybinds, (cmd) => {
        if (cmd) {
            util.emitter.emit(cmd);
        }

        if (cmd === "windowSize5") {
            util.modifyWinSize(5);
        }

        if (cmd === "windowSize10") {
            util.modifyWinSize(100);
        }

        if (cmd === "goToMiddle") {
            util.goToIndex(Math.floor(items.length / 2));
        }
    });

    return (
        <>
            <Box>
                <Text>{`Last shoutout was: ${shoutout}`}</Text>
            </Box>
            <Box display="flex" width="50%" borderStyle="round">
                <List
                    itemGenerators={itemGenerators}
                    viewState={viewState}
                    scrollBar={true}
                    scrollColor="blue"
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
