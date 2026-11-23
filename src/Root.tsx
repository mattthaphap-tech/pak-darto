import React from "react";
import { Composition, Folder } from "remotion";
import { DartoShort, DartoShortWithCaptions, DartoFrames } from "./videos/darto/Bridge";
import { DartoCaptionOverlay } from "./videos/darto/DartoCaptionOverlay";
import { DartoCaptionsOnly } from "./videos/darto/CaptionsOnly";

const common = { fps: 30, width: 1080, height: 1920 } as const;

export const Root: React.FC = () => {
  return (
    <Folder name="PakDarto">
      <Composition id="DartoShortWithCaptions" component={DartoShortWithCaptions} durationInFrames={DartoFrames} {...common} />
      <Composition id="DartoShort" component={DartoShort} durationInFrames={DartoFrames} {...common} />
      <Composition id="DartoCaptionOverlay" component={DartoCaptionOverlay} durationInFrames={DartoFrames} {...common} />
      <Composition id="DartoCaptionGreenScreen" component={() => <DartoCaptionOverlay bg="#00FF00" />} durationInFrames={DartoFrames} {...common} />
      <Composition id="DartoCaptions" component={DartoCaptionsOnly} durationInFrames={DartoFrames} {...common} />
    </Folder>
  );
};
