# Lancelot FHE benchmark: source review and reproduction plan

**Status: source reconnaissance only; no benchmark reproduced.** This note deliberately separates published claims and repository instructions from measurements made in this workspace.

## Scope selected

The selected lane is Lancelot, the fully homomorphic encryption (FHE) system for Byzantine-robust federated learning described by Jiang et al., *Nature Machine Intelligence* 7, 1657–1668 (2025), DOI [10.1038/s42256-025-01107-6](https://doi.org/10.1038/s42256-025-01107-6). The paper describes CKKS-based encrypted computations, mask-based encrypted sorting, lazy relinearization, dynamic hoisting, and GPU acceleration. Its abstract reports a 20-fold processing-speed improvement; that is a paper claim, not a result reproduced here.

The paper's code-availability statement identifies the authors' GitHub repository and Zenodo record [10.5281/zenodo.16022526](https://doi.org/10.5281/zenodo.16022526). DOI resolution currently lands on Zenodo record [16022527](https://zenodo.org/records/16022527), a software archive titled `siyang-jiang/Lancelot-Dev: Lancelot`, version `PPML`, published 2025-07-17. Zenodo's preview lists the archive as approximately 1.6 MB and shows both `cahel-main` and `lancelot-main-GPU`, including C++/CUDA CAHEL sources, Python orchestration, run scripts, example logs, and result images. The Nature paper says the code is MIT-licensed. The GitHub URL cited by the paper and the current GitHub README are discoverable through search, but direct GitHub/API access returned 404 in this environment; use the versioned Zenodo archive as the reproducibility input unless the authors' repository becomes accessible and provenance can be reconciled.

## Evidence tiers and limits

- **Primary—paper:** Nature's article/abstract and code/data-availability statements establish the published method, reported claim, public code location, and datasets. The full paper is subscription-limited in the available page view, so specific paper table values or implementation details not visible there are not independently transcribed here.
- **Primary—artifact metadata:** Zenodo's record establishes the artifact title, version label, publication date, file listing/size, and its linked GitHub project. Its preview exposes a source tree, not a successful build or test result.
- **Community/discovery only:** GitHub search-index snippets describe a suggested environment and CLI defaults (NVIDIA GPU, CUDA, CMake, Python; CIFAR10, four clients, Krum, 100 rounds, learning rate 0.001). Those snippets are not treated as verified artifact instructions because the repository could not be fetched directly. Do not use them as benchmark settings without checking the downloaded version's `README.md`, scripts, and source.
- **Local environment observation:** Python 3.11.2 and g++ 12.2.0 are available. `nvidia-smi` and `cmake` are absent, and `nvcc` was not found. Therefore this workspace cannot build/run the CUDA/GPU benchmark. No elapsed-time, accuracy, memory, or speedup measurements were taken.

## Reproduction plan (pending suitable GPU host)

1. Obtain the exact Zenodo archive and retain its record/version, download URL, byte count, and SHA-256; inspect the bundled license, source README, submodule pointers, build scripts, and any precomputed data before executing code. Prefer a clean, isolated environment; do not execute unreviewed network/install scripts with credentials or unrelated data mounted.
2. Record host GPU model/VRAM, driver, CUDA toolkit/compiler, compiler, CMake, Python and package versions. Build the archive's own CAHEL and Lancelot paths from a clean checkout; log all commands and build outputs. If the scripts download dependencies or datasets, pin and separately checksum them.
3. First run a small functional smoke test to confirm encryption-enabled execution, decryption correctness, finite metrics, and output files. Keep `cipher_open`/encryption mode explicit; an unencrypted run is not evidence of FHE performance.
4. For comparison, execute the exact paper-reported workload and baseline configurations only after recovering those settings from the full paper/source. Hold dataset split, model, client/Byzantine fraction, aggregation rule, rounds, hardware, and measurement boundaries constant. Run at least three timed repetitions after warm-up and report median and spread; separate local training, encryption/decryption, encrypted aggregation, transfers, and end-to-end time where instrumentation permits. Report accuracy and failure rates alongside speed.
5. Treat any comparison to the paper's 20× statement as non-equivalent unless its baseline, hardware, timers, and workload match. Preserve raw logs and exact commands; explain deviations. Do not claim a privacy proof, side-channel resistance, or reproduced cryptographic security from timing experiments.

## Acceptance state

- [x] Select Lancelot lane and identify paper plus its public source artifact.
- [x] Record environment limits and a bounded, evidence-aware reproduction plan.
- [ ] Acquire/checksum/inspect the exact archive in an appropriate environment.
- [ ] Build and smoke-test the published implementation with CUDA/GPU enabled.
- [ ] Reproduce the paper workload and comparison, with raw logs and deviations documented.

Nothing in this reconnaissance completes the backlog's benchmark-reproduction item.
