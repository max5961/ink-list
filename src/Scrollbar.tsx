import React, { useEffect } from "react";
import { Box, measureElement, Text } from "ink";
import { ListWindow } from "./List.js";

type SBProps = {
    listWindow: ListWindow;
    height: number;
    width: number;
};

function ScrollBar({ listWindow, height, width }: SBProps): React.ReactNode {
    const { start, mid, end, windowSize, listSize, idx } = listWindow;

    if (!listSize || windowSize >= listSize) return null;

    // windowSize / listSize gets the relative percentage of the window to all items
    // line height * (windowSize / listSize) gets the lines the bar should take up
    const barHeight = Math.max(
        0,
        Math.ceil(height * (Math.min(listSize, windowSize) / listSize)),
    );

    const preStart = height * (start / listSize);
    const preEnd = height * ((listSize - end) / listSize);

    let startHeight = Math.max(0, Math.floor(preStart));
    let endHeight = Math.max(0, Math.floor(preEnd));

    return (
        <>
            <Box flexDirection="column" height="100%">
                {new Array(startHeight).fill(0).map((_, idx) => {
                    return <Text key={idx}> </Text>;
                })}
                {new Array(barHeight).fill(0).map((_, idx) => {
                    // prettier-ignore
                    return <Text key={idx} backgroundColor="white"> </Text>;
                })}
                {new Array(endHeight).fill(0).map((_, idx) => {
                    return <Text key={idx}> </Text>;
                })}
            </Box>
        </>
    );
}

const MemoizedScrollBar = React.memo(ScrollBar);

export default MemoizedScrollBar;
