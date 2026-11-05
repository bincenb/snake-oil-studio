# Virtual Chem Labs

An online lab course pack for chemistry, with **57 complete labs** that follow a standard syllabus for General Chemistry I & II, Organic Chemistry I & II, Quantitative Analysis, Biochemistry and Physical Chemistry.

Each lab has six tabs:

1. **Overview**: objectives, background theory with equations and data tables, real-lab safety notes.
2. **Pre-lab**: auto-checked questions, with explanations.
3. **Experiment**: interactive instruments that produce realistic, noisy data.
4. **Data**: a notebook of every reading the student recorded, plus their curves (CSV download).
5. **Analysis**: questions checked against the student's *own* data, with attempt counts.
6. **Report**: a printable report (Print / Save as PDF, or download as HTML) with a verification code.

It is a static site with no build step, no server and no accounts. It works offline once loaded.

## Using it with a class

1. **Host it.** On GitHub: *Settings → Pages → Deploy from branch* (choose the branch and `/ (root)`). The labs are then at
   `https://<user>.github.io/<repo>/chem-labs/`. Any static web host works, and so does opening `chem-labs/index.html` locally.
2. **Give each section a class code**, for example `CHEM101-F26-02`.
3. **Students enter their full name and the class code.** Together these generate each student's personal unknowns: unknown metal, acid concentration, hydrate, NMR unknowns and so on. Two students won't have the same data, and changing the code each term gives everyone new unknowns.
4. **Students submit the Report tab** as a PDF.
5. **Check work with the instructor key** (footer link, or `#/key`). Enter a student's name and class code to see their unknowns, the pre-lab key, and expected analysis results for every lab. The key runs a careful simulated attempt of the lab to produce typical values.

### How grading works

- Numeric answers are checked against values computed from the student's own recorded data, within a small tolerance.
- Many answers also have a **truth check**. If the arithmetic matches the student's data but the result is far from the real unknown (an overshot endpoint, a misread buret, a sample that wasn't heated to constant mass), the student is told the problem is in the *measurement*, and to repeat it.
- Free-response questions (conclusions, error analysis, mechanisms) are saved to the report for you to grade.
- Reports show the auto-checked score, the number of attempts, and a verification code.

### Limitations to know about

- Student work is saved in **that browser's local storage**. A student who switches computers should download their report first.
- The instructor key is **not password-protected**. Don't share its link with students.
- This is a teaching simulation. Numbers are realistic but simplified (for example, activity effects and buoyancy corrections are ignored), and the safety notes describe the real lab.

## Instruments

| Instrument | Used for |
| --- | --- |
| Measurement bench (balance, meters, test tubes, flame) | masses, volumes, temperatures, voltages, rotations, qualitative tests |
| Titration station | buret with a magnified meniscus (students read it themselves), indicators that respond to a full charge-balance pH solver, optional pH meter and live curve, colour endpoints for EDTA and permanganate |
| Time-series data logger | calorimetry, cooling curves, kinetics, distillation curves, enzyme progress curves |
| Spectrophotometer | blanking, single-wavelength readings, full spectrum scans, solution colours computed from the spectrum |
| Grapher | student-entered or auto-filled data, axis transforms (ln, 1/x…), least-squares fit, R² |
| TLC plate / SDS-PAGE gel | solvent choice, UV visualization, click-to-measure distances |
| Spectrum viewer | IR, ¹H NMR (splitting & integrations), ¹³C NMR, MS, GC/HPLC with integration reports, emission lines |
| Synthesis workflow | choose reagents, conditions, workup and purification; the yield, purity and melting point follow from those choices |
| 3D model kit | rotatable VSEPR models with lone pairs |

## Labs
### General Chemistry I (12 labs)

1. Measurement, Significant Figures & Glassware Precision
2. Density: Identifying an Unknown Metal and Liquid
3. Separation of a Mixture: Sand, Salt & Ammonium Chloride
4. Formula of a Hydrate
5. Stoichiometry & the Limiting Reactant
6. Atomic Emission Spectra & Flame Tests
7. Lewis Structures & Molecular Geometry (VSEPR)
8. Calorimetry: Specific Heat & Heat of Neutralization
9. Hess's Law: Enthalpy of Formation of MgO
10. Gas Laws: The Gas Constant & Boyle's Law
11. Acid–Base Titration: Standardizing NaOH & Analyzing Vinegar
12. Spectrophotometry & Beer's Law: Dye in a Sports Drink

### General Chemistry II (12 labs)

1. Molar Mass by Freezing-Point Depression
2. Chemical Kinetics I: Rate Law of Crystal Violet Fading
3. Chemical Kinetics II: Iodine Clock Reaction & Activation Energy
4. Chemical Equilibrium: Le Châtelier's Principle
5. Determination of an Equilibrium Constant (FeSCN²⁺)
6. pH, Weak-Acid Ka & Buffer Design
7. Potentiometric Titration: Ka & Molar Mass of an Unknown Acid
8. Solubility Product of Calcium Hydroxide
9. Thermodynamics of Borax Dissolution
10. Electrochemistry: Galvanic Cells & the Nernst Equation
11. Electrolysis: Faraday's Constant & Avogadro's Number
12. Qualitative Analysis of Group I Cations

### Organic Chemistry I (11 labs)

1. Melting Point & Identification by Mixed Melting Point
2. Recrystallization: Purifying Acetanilide
3. Acid–Base Extraction of a Three-Component Mixture
4. Simple & Fractional Distillation with GC Analysis
5. Thin-Layer Chromatography of Analgesics
6. Column Chromatography: Fluorene & 9-Fluorenone
7. Infrared Spectroscopy: Identifying Functional Groups
8. Nucleophilic Substitution: SN1 & SN2 Reactivity
9. SN1 Synthesis of tert-Butyl Chloride
10. E1 Dehydration of 2-Methylcyclohexanol
11. Stereochemistry & Polarimetry: Enantiomers of Carvone

### Organic Chemistry II (8 labs)

1. Structure Determination by NMR & Mass Spectrometry
2. Grignard Synthesis of Triphenylmethanol
3. Diels–Alder Reaction: Anthracene + Maleic Anhydride
4. Electrophilic Aromatic Substitution: Nitration of Methyl Benzoate
5. Aldol Condensation: Synthesis of Dibenzalacetone
6. Fischer Esterification: Isopentyl Acetate (Banana Oil)
7. Sodium Borohydride Reduction of 9-Fluorenone
8. Qualitative Organic Analysis: Classification Tests

### Quantitative Analysis (6 labs)

1. Statistics of Measurement: Calibrating a Volumetric Pipet
2. Gravimetric Determination of Chloride
3. Water Hardness by EDTA Titration
4. Redox Titration: Iron in an Ore by Permanganate
5. Spectrophotometric Determination of Iron in a Supplement
6. HPLC Determination of Caffeine in Beverages

### Biochemistry (4 labs)

1. Titration Curve of an Unknown Amino Acid
2. Protein Quantitation by the Bradford Assay
3. Enzyme Kinetics: Michaelis–Menten & Inhibition
4. SDS-PAGE: Molecular Weight of Proteins

### Physical Chemistry (4 labs)

1. Bomb Calorimetry: Enthalpy of Combustion of Naphthalene
2. Vapor Pressure & Enthalpy of Vaporization
3. Particle in a Box: Spectra of Conjugated Cyanine Dyes
4. Thermodynamics of a Galvanic Cell from E vs T

## Editing or adding labs

Each course is one file in `labs/` (`gc1.js`, `gc2.js`, `oc1.js`, `oc2.js`, `analytical.js`, `biochem.js`, `pchem.js`). A lab is a plain object passed to `CL.lab({...})`:

- `setup(R)` uses the seeded random generator `R` to create the student's unknowns.
- `parts[].sim` configures instruments (`bench`, `titration`, `series`, `spectro`, `graph`, `tlc`, `spectrum`, `synth`, `vsepr`).
- `questions[]` hold `ans: (S, D) => value`, where `S` is the unknowns and `D(key)` is the student's recorded reading. Optional fields are `tol`/`atol`, `truth`/`ttol` and `choices`.

To change wording, tolerances or unknown ranges, edit the lab definition. No build step is needed. The engine is in `assets/` (`engine.js` for pages, questions and the report, `sims.js` for instruments, `chem.js` for the pH solver, indicators and spectra).
