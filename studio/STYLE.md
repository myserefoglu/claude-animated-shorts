# House style: Vox-style documentary shorts

The rules every video is checked against. Agreed with the user on 2026-11-03 after reviewing the
references in `references/vox/` (NOTES.md + frames + sheets). When in doubt, put a frame next to a
reference frame.

## The look in one line
**A paper-cut collage world in 2.5D:** every element is a hand-cut paper piece (white cut edge or
torn edge, paper texture, a soft shadow on the layer below), stacked in depth and moving slightly
and independently while the camera drifts through. The paper world is muted; the key object is a
vivid printed cut-out. Beethoven's pacing and serif words on top.

**Paper-cut is the core, not an option.** (Corrected 2026-11-03: an earlier v3 draft demoted it
after the black-and-white discussion. The user's point: the paper-cut pieces moving slightly is
what gives the 3D feeling.) The cable-car parallax technique is the *mechanism*; paper is the
*material* that makes the mechanism read as 3D.

References: `mumbai_*` (layered paper, cut photos, tape, edges), `ori_*` (paper relief, one accent),
`beethoven_*` (pacing, cut-out compositing, serif type; NOT its black and white), `parallax_*`
(the layer + camera mechanism).

## Paper-cut rules (what makes 2D feel 3D)
1. **Every element is a separate cut piece:** white cut edge on printed photos and figures, torn
   edges on paper sheets (sky, ground, hills, water, headline strips). No element without an edge.
2. **Shadows between layers:** each piece casts a soft offset shadow onto the layer behind. The
   shadow's offset grows with the gap between layers, so depth is visible.
3. **Independent small motion:** pieces sway, drift or breathe slightly (fractions of a degree,
   a few px), each at its own rhythm, as if lightly moved by hand or air. Shadows move with them.
4. **Camera parallax on top:** slow push or lateral drift, near pieces move more than far ones.
5. **Paper texture everywhere:** fibres, grain, slight print misregistration on printed pieces,
   tape on some joins.
6. **Entrances:** pieces slide in from an edge, drop onto the stack, or are revealed by a tear;
   they settle without bounce.

## Colour
- **Background layers are subdued:** lower saturation (about 40-60 % of the original), slightly
  darker, pulled towards one colour family per scene.
- **The key object stays vivid and is visibly lifted:** brightness about +10 %, saturation
  +20-25 %, slightly more contrast, plus a soft warm light glow behind it. The world behind it is
  pulled down a step (saturation about 75 %, brightness about 90 %) so the gap is visible.
  (User, 2026-11-03: the first paper test did not brighten the key object enough.) One key object
  (or one group, like a crowd of Labubus) per scene, decided per row in the imagery plan.
- **Atmospheric depth:** the farther the layer, the hazier and less saturated. This also sells
  the 3D feeling.
- Done in post, not in the prompt: images are generated (or supplied) in full colour, the key
  object is cut out, and each layer is graded separately in Remotion. This keeps the rule exact
  and lets colour be animated (e.g. a key object fading to grey on a story beat).
- **No full black and white.** The user rejected it.

## The 3D feeling from 2D (parallax)
- 3-5 depth layers per image: foreground, key object, midground, background, sky.
- Cut-outs via rembg; the area hidden behind a cut-out is filled (Nano Banana edit, or inpainting
  plus blur for far layers).
- The camera moves through the layers: slow push-in or lateral drift, near layers move more.
  Typical per shot: background 2-4 % scale, key object 6-10 %.
- Depth of field: background softly blurred, key object sharp; rack focus as a transition.
- One small sign of life per shot on one layer (sway, cloud drift, dust in light), never
  everything wobbling.
- Soft contact shadows under cut-outs so they sit in the scene.

## Pacing: two modes
| Mode | When | Rules |
|---|---|---|
| **Cinematic** (default) | narrative lines | new image every 2-3 s; always a slow camera move, never fully frozen; words land on stressed syllables; rack focus or soft dissolves between shots |
| **Burst** | data and escalation beats: multipliers, drops, records, prices | quick cuts, snappy moves, counting, piles multiplying, charts, a price ticking up fast. About 15-20 % of the runtime at most |

Bursts are built from the same material as the rest of the film (real cut-outs, boxes, printed
paper charts, real numbers in the serif). Never flat vector shapes, confetti, sunbursts, white
flashes or cartoon bounce: that was Labubu v1. Not everything needs a chart: a fast counter (a
price racing up) is often clearer.

## User video clips
- Played **as they are, in colour**. Only a light touch so they belong to the same film: the
  same film grain and a slight contrast match.
- Ways in: a straight cut on a beat, or a push into a screen/window inside a scene before the clip
  goes full screen. Low-quality footage can play inside a device or frame in the scene.
- The clip's own audio can take over for a moment when the narration pauses.

## Typography
- One elegant **serif**, centred, word by word: small connecting words, then one big key word
  ("He kept" / *composing*).
- **Off-white** with a soft shadow on dark scenes, **near-black** on light scenes.
- **The key word takes the key object's colour** (e.g. "Everyone wanted *one*" with *one* in
  Labubu pink).
- Numbers in bursts use the same serif, large.
- **Text always glows subtly, on every scene** (user, 2026-11-03: otherwise it washes out).
  Light text: a soft glow in its own colour (6/22/48 px) plus a faint dark halo. Dark text: a
  soft light halo only (a dark glow reads as a smudge). The coloured key word glows in its colour.
- Text is added in Remotion, never baked into AI images.

## People
Silhouettes, from behind, out of focus, or real photos the user supplies. No recognisable real
faces generated by AI (the models also refuse them).

## Motion rules (checked with `scripts/motion_stats.py`)
| Measure | Cinematic target | Labubu v1 (what not to do) |
|---|---|---|
| calm + held % | 60 % or more | 31 % |
| busy % | under 15 % overall (bursts excepted) | 30 % |
| new image | every 2-3 s | 0.8 s |
| white flashes | 0 | 4 |
| mean saturation | 0.20-0.35 (subdued world, vivid object) | 0.42 |

Banned everywhere: spring bounce, overshoot on scale, screen shake (one hit allowed for a violent
beat), white flash cuts, constant wobble, rays/sunbursts, confetti, Anton-with-outline meme text.

## Sound
Thrill and danger, as in the Beethoven reference: deep drones, low rhythmic pulses, swells,
impacts on reveals, silence before a twist. Bursts get ticks, risers and hits. Narration always on
top, music ducked. Real music from a library or Lyria for the final mix; synthesized beds are for
drafts.

## Voice
Calm, low, deliberate, with breathing room between lines (not the bright, upbeat v1 voice).
Chosen voice: **Gemini `Algenib`** (gravelly), via `gemini-2.5-flash-preview-tts`, plain text only;
pauses come from punctuation ("...") and line breaks. Picked from a 5-voice audition on 2026-11-03.

## Paper-world variants (all paper-cut; pick per row)
- **Evidence desk** (`mumbai_*`): screenshots, documents, maps, red string, stamps, on paper.
  Good for facts, dates, connections. Keep it in colour, background subdued.
- **Paper diorama** (`ori_*`): layered paper scenes, for a product or "how it works" hero shot,
  possibly an AI video clip.

## Image prompt style block (reuse verbatim, change only the scene)
"Mixed-media hand-cut PAPER COLLAGE, layered paper-craft scene: torn and scissor-cut paper edges,
visible paper fibres and grain, soft real shadows between paper layers, printed halftone photo
cut-outs with white edges, tape on some joins. Muted paper palette ({palette}). Each element a
separate piece with a clear edge and its own shadow. {scene}. No text, no logos. NOT 3D render,
NOT CGI. 2K."
The key object is usually the user's real photo, cut out and added in Remotion as a printed
cut-out with a white edge; the generated plate provides the paper world around it. Generating
separate pieces (sky sheet, ground sheet, props) instead of one flat poster keeps parallax easy.
