# Roboflow workflow — manual changes (done in the Roboflow app, not in code)

The workflow lives in the cloud, so these steps cannot be applied from this repo.
After each change, export the workflow definition and commit it here as `workflow.json`
so the exact configuration used for a study is versioned.

1. **Lower the model confidence floor to ~0.05.** The app filters by τ in the browser and
   records it in every export.
2. **Small objects:** add *Image Slicer* → model → *Detections Stitch* (SAHI-style), tiles at the
   model's native size with 20–25 % overlap. Validate on long fibres crossing tile borders.
3. **Optional consensus:** SAM3 + a model trained on your own data, combined with
   *Detections Consensus* to cut false positives.
4. **Optional two-stage classification:** *Dynamic Crop* + classifier to decide
   fibre / fragment / sphere / artefact.
5. **Minimum area filter** and border-object handling are applied in the client (see the UI).
6. **Output names must stay:** `sam_3_output` (with `image`, `predictions[].points`, `confidence`,
   `detection_id`), `bounding_box_visualization_output`, `box_count`, `vision_events_message`.
7. **Privacy:** disable *Active Learning* / *Dataset Upload* blocks unless you have consent to retain the images.
8. Once the in-app overlay is validated, `bounding_box_visualization_output` can be removed
   to shrink responses by several MB.
