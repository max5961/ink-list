import React from "react";
import { Box, Text } from "ink";
import { ViewState } from "./List.js";

type SBProps = {
    viewState: ViewState;
    height: number;
    width: number;
    color: string;
};

function ScrollBar({
    viewState,
    height,
    width,
    color,
}: SBProps): React.ReactNode {
    const { _start, _end, _winSize, _itemsLen } = viewState;

    if (!_itemsLen || _winSize >= _itemsLen) return null;

    // _winSize / _itemsLen gets the relative percentage of the window to all items
    // line height * (_winSize / _itemsLen) gets the lines the bar should take up
    const barHeight = Math.max(
        0,
        Math.ceil(height * (Math.min(_itemsLen, _winSize) / _itemsLen)),
    );

    const preStart = height * (_start / _itemsLen);
    const preEnd = height * ((_itemsLen - _end) / _itemsLen);

    let startHeight = Math.max(0, Math.floor(preStart));
    let endHeight = Math.max(0, Math.floor(preEnd));

    return (
        <>
            <Box flexDirection="column" height="100%">
                {new Array(startHeight).fill(0).map((_, _idx) => {
                    return <Text key={_idx}> </Text>;
                })}
                {new Array(barHeight).fill(0).map((_, _idx) => {
                    // prettier-ignore
                    return <Text key={_idx} backgroundColor={color}> </Text>;
                })}
                {new Array(endHeight).fill(0).map((_, _idx) => {
                    return <Text key={_idx}> </Text>;
                })}
            </Box>
        </>
    );
}

const MemoizedScrollBar = React.memo(ScrollBar);

export default MemoizedScrollBar;
