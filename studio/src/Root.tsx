import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { LabubuShort, LABUBU_FRAMES } from "./videos/labubu/Labubu";
import { PaperTest, PAPERTEST_FRAMES } from "./videos/papertest/PaperTest";
import { Lab2, LAB2_FRAMES } from "./videos/lab2/Lab2";

export const Root: React.FC = () => (
  <>
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="LabubuShort" component={LabubuShort} durationInFrames={LABUBU_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="PaperTest" component={PaperTest} durationInFrames={PAPERTEST_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Lab2" component={Lab2} durationInFrames={LAB2_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
