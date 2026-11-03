import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { LabubuShort, LABUBU_FRAMES } from "./videos/labubu/Labubu";

export const Root: React.FC = () => (
  <>
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="LabubuShort" component={LabubuShort} durationInFrames={LABUBU_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
