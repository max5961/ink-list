import React from "react";
import { Box, Text } from "ink";
import { ViewState } from "./List.js";

type SBProps = {
    viewState: ViewState;
    height: number;
    width: number;
};

function ScrollBar({ viewState, height, width }: SBProps): React.ReactNode {
    const { start, end, windowSize, itemsLength, idx } = viewState;

    if (!itemsLength || windowSize >= itemsLength) return null;

    // windowSize / itemsLength gets the relative percentage of the window to all items
    // line height * (windowSize / itemsLength) gets the lines the bar should take up
    const barHeight = Math.max(
        0,
        Math.ceil(height * (Math.min(itemsLength, windowSize) / itemsLength)),
    );

    const preStart = height * (start / itemsLength);
    const preEnd = height * ((itemsLength - end) / itemsLength);

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
