# Checking known cellular-automata signals and glider streams — 2026-11-05

## First pin down which “256 rules”

The number 256 is exact for **elementary cellular automata (ECA)**: a one-
dimensional line of binary cells, synchronously updated from the left, center,
and right cells. There are eight possible 3-cell neighborhoods, each assigned
one binary output, so there are `2^8 = 256` local rule tables. It is not the
number of all cellular automata. The general CA definition also allows other
lattice dimensions, neighborhoods, state counts, and boundary/update models.
See the [Scholarpedia CA overview](http://www.scholarpedia.org/article/Cellular_automata#Elementary_Cellular_Automata).

The familiar moving glider and its circuit technology are usually discussed
under **two-dimensional Conway Life, B3/S23**, not as a generic property of
those 256 ECA rules. A glider-like shape in another CA may evolve with a
different period or velocity; the rule and state encoding must accompany any
pattern claim. LifeWiki describes gliders, glider streams, phase, timing, and
other signal carriers in its [general-technology tutorial](https://conwaylife.com/wiki/Tutorials/General_technology).

“Signal bus” is not a unique pattern identifier. For Life-like circuits, the
closest precise terms are a **wire/lane**, a **stream** of spaceships, and the
signal-carrying components. A glider stream can encode presence/absence or
phase, but the data interpretation belongs to a particular circuit design;
a visual line of cells alone is not enough to call it a bus.

## How to check a candidate signal

1. **Recover the CA configuration, not just an image.** Obtain coordinates or
   successive grids of cell states. Record axis direction, cell/bit order,
   generation spacing, initial seed, boundary condition (infinite, bounded,
   or toroidal), and any background state. A screenshot or encrypted byte string
   with no cell layout is not yet a pattern-search input.
2. **Pin the rule.** For ECA, enumerate rules `0..255` against adjacent rows.
   For each observed neighborhood `(left, center, right)`, record the next
   center state. A candidate rule survives only if every occurrence agrees.
   If all eight neighborhoods have been observed, the truth table identifies
   one ECA rule; if some are missing, several rules may remain consistent.
   For a known Life-like candidate, simulate the exact `B3/S23` rule instead
   of assuming a one-dimensional ECA.
3. **Match exact cells and phase.** Parse a standard RLE pattern with its
   `rule =` header, normalize coordinates by translation, and compare exact
   live-cell sets. For a moving object, test its successive phases and
   displacement; do not compare only a thumbnail or population count. RLE is
   the common pattern interchange format, and its header can name B3/S23 or a
   different rule ([LifeWiki RLE format](https://conwaylife.com/wiki/Run_Length_Encoded)).
4. **Confirm movement across time.** A single frame can match one glider phase
   by coincidence. Under B3/S23, the standard glider has five live cells in a
   3×3 box; after four generations it returns to the same phase, translated
   one cell diagonally. LifeWiki records its four-generation period, diagonal
   displacement, and use for transmitting information
   ([Glider](https://conwaylife.com/wiki/Glider)). Require the candidate time
   series to match the phase sequence and the expected translation.
5. **Test the stream, not just one spaceship.** Track each matched glider
   through `(x, y, generation)`, cluster trajectories into lanes, and measure
   inter-arrival times. A stream is periodic only when its pattern repeats;
   LifeWiki notes that a stream's period can depend on both the gun's period
   and the spaceship's period ([Stream](https://conwaylife.com/wiki/Stream)).
   For a bit stream, define the slot width and phase from the reference circuit
   before treating a missing glider as `0`.
6. **Use rule-specific templates.** A non-Life automaton may carry a signal as
   a spaceship, a perturbation on a nonempty wire, a fuse, or another reaction.
   LifeWiki's technology tutorial distinguishes these signal carriers. Do not
   search for Conway's glider bitmap and treat a lookalike as a match under a
   different rule.

A standard positive-control vector for a future detector is:

```text
#N Glider
x = 3, y = 3, rule = B3/S23
bo$2bo$3o!
```

With zero-based coordinates (`x` right, `y` down), the initial live cells are
`{(1,0), (2,1), (0,2), (1,2), (2,2)}`. A minimal standalone B3/S23 reference simulation was run against this
published pattern; after four updates it produced the same five-cell pattern
translated by `(+1,+1)`. That validates a **pattern detector/simulator**, not a
cipher or decryption method. A future
stream detector should add a reference gun/stream RLE and assert its rule,
phase, lane, and emission times as a second positive control.

For larger known objects, Life uses **apgcodes** to canonically identify many
still lifes, oscillators, and spaceships across phases/orientations; the format
has size and object-class limits, so it is an index rather than a universal
recognizer ([apgcode](https://conwaylife.com/wiki/apgcode)). Programs such as
[apgsearch](https://conwaylife.com/wiki/Apgsearch) demonstrate automated
simulation and census of still lifes, oscillators, spaceships, and growth
patterns under specified rules. Neither a canonical code nor a census proves
that an unrelated program uses that CA.

## What this means for the Zangi target

There are two unrelated meanings of “Signal” here:

- **Signal Protocol** is the messaging cryptography referenced by Zangi's
  inspected wrapper classes.
- A **CA signal** is a moving or changing cell pattern such as a Life glider
  stream.

The static Zangi pass found Signal Protocol API references and a separate
AES-GCM group-push helper, but no cellular-automata rule or cell-grid encoding
in the inspected DEX/native paths. Resources and all other assets were not
exhaustively searched, so this does not prove a Life RLE or CA state trajectory
is absent from every package component. No grid or trajectory has been observed
on which to run the pattern matcher, and there is no evidence that a Life signal
bus is part of Zangi's encryption. To resume target-specific
pattern checking, the missing evidence is an exact CA input/state sequence,
source/update rule, or a known plaintext/ciphertext-to-grid vector. The
existing CyberChef Rule 110, Game of Life, and Larger Game of Life entries are
visualizers, not evidence that Zangi uses those rules; no CA cipher recipe was
added.

## Sources reviewed

- Hector Zenil and Genaro J. Martinez, [Cellular automata](http://www.scholarpedia.org/article/Cellular_automata), *Scholarpedia* 19(4):53227 (2024), DOI [10.4249/scholarpedia.53227](http://dx.doi.org/10.4249/scholarpedia.53227).
- LifeWiki: [Glider](https://conwaylife.com/wiki/Glider), [General technology](https://conwaylife.com/wiki/Tutorials/General_technology), [Stream](https://conwaylife.com/wiki/Stream), [Run Length Encoded](https://conwaylife.com/wiki/Run_Length_Encoded), [apgcode](https://conwaylife.com/wiki/apgcode), and [apgsearch](https://conwaylife.com/wiki/Apgsearch). Pages reviewed 2026-11-05.
