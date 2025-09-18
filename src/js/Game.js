import { World } from "./World.js";
import { Cube } from "./Cube.js";
import { Controls } from "./Controls.js";
import { Scrambler } from "./Scrambler.js";
import { Transition } from "./Transition.js";
import { Preferences } from "./Preferences.js";
import { Confetti } from "./Confetti.js";
import { Storage } from "./Storage.js";
import { Themes } from "./Themes.js";
import { ThemeEditor } from "./ThemeEditor.js";
import { States } from "./States.js";
import solver from "rubiks-cube-solver";

const STATE = {
  Menu: 0,
  Playing: 1,
  Complete: 2,

  Prefs: 4,
  Theme: 5,
};

const BUTTONS = {
  Menu: ["prefs"],
  Playing: ["back"],
  Complete: [],
  Prefs: ["back", "theme"],
  Theme: ["back", "reset"],
  None: [],
};

const SHOW = true;
const HIDE = false;

const FAST = true;
const SLOW = false;
let solutionSteps = "";
let scramble = [];
let presentIndex = 0;
let solutionStepsArray = [];

class Game {
  constructor() {
    this.setup2DCube();
  }

  setup2DCube() {
    const FACE_COLORS = {
      U: "#fff7ff", // white (Top)
      D: "#ffef48", // yellow (Bottom)
      F: "#ef3923", // red (Front)
      R: "#41aac8", // blue (Right)
      B: "#ff8c0a", // orange (Back)
      L: "#82ca38", // green (Left)
    };

    let selectedColor = null;
    let currentFace = "F";

    const cubeState = {
      U: [
        "#41aac8",
        "#41aac8",
        "#41aac8",
        "#41aac8",
        "#fff7ff",
        "#41aac8",
        "#41aac8",
        "#41aac8",
        "#41aac8",
      ],
      D: [
        "#82ca38",
        "#82ca38",
        "#82ca38",
        "#82ca38",
        "#ffef48",
        "#82ca38",
        "#82ca38",
        "#82ca38",
        "#82ca38",
      ],
      F: [
        "#fff7ff",
        "#fff7ff",
        "#fff7ff",
        "#fff7ff",
        "#ef3923",
        "#fff7ff",
        "#fff7ff",
        "#fff7ff",
        "#fff7ff",
      ],
      B: [
        "#ffef48",
        "#ffef48",
        "#ffef48",
        "#ffef48",
        "#ff8c0a",
        "#ffef48",
        "#ffef48",
        "#ffef48",
        "#ffef48",
      ],
      L: [
        "#ff8c0a",
        "#ff8c0a",
        "#ff8c0a",
        "#ff8c0a",
        "#82ca38",
        "#ff8c0a",
        "#ff8c0a",
        "#ff8c0a",
        "#ff8c0a",
      ],
      R: [
        "#ef3923",
        "#ef3923",
        "#ef3923",
        "#ef3923",
        "#41aac8",
        "#ef3923",
        "#ef3923",
        "#ef3923",
        "#ef3923",
      ],
    };

    const adjacentFaces = {
      F: { top: "U", bottom: "D", left: "L", right: "R" },
      B: { top: "U", bottom: "D", left: "R", right: "L" },
      L: { top: "U", bottom: "D", left: "B", right: "F" },
      R: { top: "U", bottom: "D", left: "F", right: "B" },
      U: { top: "B", bottom: "F", left: "L", right: "R" },
      D: { top: "F", bottom: "B", left: "L", right: "R" },
    };

    const COLORS = Object.values(FACE_COLORS);
    const colorButtons = document.getElementById("colorButtons");
    const face = document.getElementById("face");
    const faceSelector = document.getElementById("faceSelector");
    const printButton = document.getElementById("printButton");
    const output = document.getElementById("output");

    // Create color selector buttons
    Object.entries(FACE_COLORS).forEach(([label, color], i) => {
      const btn = document.createElement("button");
      btn.title = label;
      btn.style.backgroundColor = color;
      btn.style.width = "30px";
      btn.style.height = "30px";
      btn.style.border = "2px solid white";
      btn.style.marginRight = "5px";
      btn.style.cursor = "pointer";

      btn.addEventListener("click", () => {
        selectedColor = color;
        [...colorButtons.children].forEach((b) => (b.style.outline = "none"));
        btn.style.outline = "2px solid white";
      });
      cubeState[label][4] = color;

      colorButtons.appendChild(btn);
    });

    // Create 9 cuboids (face tiles)
    const cuboids = [];
    for (let i = 0; i < 9; i++) {
      const div = document.createElement("div");
      div.style.width = "50px";
      div.style.height = "50px";
      div.style.backgroundColor = "#555";
      div.style.cursor = "pointer";
      div.style.border = "1px solid #999";
      div.addEventListener("click", (event) => {
        if (i == 4) {
          event.preventDefault();
          return;
        }
        if (selectedColor) {
          div.style.backgroundColor = selectedColor;
          cubeState[currentFace][i] = selectedColor;
        }
      });
      cuboids.push(div);
      face.appendChild(div);
    }

    const convertStateForSolver = (state) => {
      const colorToFaceLetter = {};
      Object.entries(FACE_COLORS).forEach(([face, color]) => {
        // The solver expects single-letter face names (U, D, L, R, F, B)
        colorToFaceLetter[color] = face.charAt(0);
      });

      // The solver expects the faces in FRUDLB order.
      const faceOrder = ["F", "R", "U", "D", "L", "B"];

      const data = faceOrder
        .map((faceLetter) =>
          state[faceLetter]
            .map((hexColor) => colorToFaceLetter[hexColor] || "X") // 'X' for gray/unassigned
            .join("")
        )
        .join("");

      return data;
    };

    // Face change logic with validation
    faceSelector.addEventListener("change", (event) => {
      const newFace = event.target.value;
      const currentColors = cubeState[currentFace];
      const isComplete = currentColors.every((color) => color !== "#555");

      // if (!isComplete) {
      //   alert(`❗ Fill all 9 cuboids on the "${currentFace}" face before switching.`);
      //   faceSelector.value = currentFace;
      //   return;
      // }

      currentFace = newFace;
      cubeState[currentFace].forEach((color, i) => {
        cuboids[i].style.backgroundColor = color;
      });
      updateSurroundingFaces();
    });

    // Print/validate cube state
    printButton.addEventListener("click", () => {
      output.style.display = "block";
=
      const allColors = Object.values(cubeState).flat();
      const usedColors = new Set(allColors);
      usedColors.delete("#555");

      if (usedColors.size !== 6) {
        output.textContent = `❌ Cube must use exactly 6 colors.\nUsed: ${[
          ...usedColors,
        ].join(", ")}`;
        return;
      }

      const colorCounts = {};
      for (const color of allColors) {
        if (color === "#555") continue;
        colorCounts[color] = (colorCounts[color] || 0) + 1;
      }

      const overused = Object.entries(colorCounts).filter(
        ([color, count]) => count > 9
      );
      if (overused.length > 0) {
        const msgs = overused.map(
          ([color, count]) => `${color} used ${count} times`
        );
        output.textContent =
          `❌ Each color can only appear up to 9 times.\n` + msgs.join("\n");
        return;
      }

      output.textContent =
        `✅ Cube is valid!\n` + JSON.stringify(cubeState, null, 2);

      const solverString = convertStateForSolver(cubeState);

      const solution = solver(solverString.toLowerCase());

      if (solution && typeof solution === "string") {
        // The solver returns moves with 'prime' (e.g., "Rprime"),
        // but the scrambler expects an apostrophe (e.g., "R'").
        const scramblerFriendlySolution = solution.replace(/prime/g, "'");

        solutionSteps = scramblerFriendlySolution;
        output.textContent += `\nSolution: ${scramblerFriendlySolution}`;

        // Use the game's scrambler and controls to animate the solution.
        this.setup3DCube();
      } else {
        output.textContent += "\n❌ No solution found.";
      }
    });

    // Initialize face with default face data
    cubeState[currentFace].forEach((color, i) => {
      cuboids[i].style.backgroundColor = color;
    });

    function createStrip(id) {
      const container = document.getElementById(id);
      container.innerHTML = "";
      for (let i = 0; i < 9; i++) {
        const tile = document.createElement("div");
        tile.style.width = "30px";
        tile.style.height = "30px";
        tile.style.border = "1px solid #888";
        tile.style.backgroundColor = "#222";
        tile.style.display = "inline-block";
        container.appendChild(tile);
      }
    }

    function updateSurroundingFaces() {
      const adj = adjacentFaces[currentFace];

      function updateStrip(stripId, faceKey) {
        const container = document.getElementById(stripId);
        const tiles = container.children;
        const colors = cubeState[faceKey];

        for (let i = 0; i < 9; i++) {
          tiles[i].style.backgroundColor = colors[i];
        }
      }

      updateStrip("adj-top", adj.top);
      updateStrip("adj-bottom", adj.bottom);
      updateStrip("adj-left", adj.left);
      updateStrip("adj-right", adj.right);
    }

    createStrip("adj-top");
    createStrip("adj-bottom");
    createStrip("adj-left");
    createStrip("adj-right");
    updateSurroundingFaces();
  }

  setup3DCube() {
    const customCube = document.querySelector("#custom-cube");
    customCube.style.display = "none";
    const mainUi = document.querySelector("#main-ui");
    mainUi.style.display = "block";
    this.dom = {
      ui: document.querySelector(".ui"),
      game: document.querySelector(".ui__game"),
      back: document.querySelector(".ui__background"),
      prefs: document.querySelector(".ui__prefs"),
      theme: document.querySelector(".ui__theme"),
      texts: {
        title: document.querySelector(".text--title"),
        note: document.querySelector(".text--note"),
        complete: document.querySelector(".text--complete"),
        best: document.querySelector(".text--best-time"),
        theme: document.querySelector(".text--theme"),
        step: document.querySelector(".text--step"),
      },
      buttons: {
        prefs: document.querySelector(".btn--prefs"),
        back: document.querySelector(".btn--back"),
        reset: document.querySelector(".btn--reset"),
        theme: document.querySelector(".btn--theme"),
        next: document.querySelector(".btn--next"),
        prev: document.querySelector(".btn--prev"),
      },
    };

    this.world = new World(this);
    this.cube = new Cube(this);
    this.controls = new Controls(this);
    this.scrambler = new Scrambler(this);
    this.transition = new Transition(this);
    this.preferences = new Preferences(this);
    this.storage = new Storage(this);
    this.confetti = new Confetti(this);
    this.themes = new Themes(this);
    this.themeEditor = new ThemeEditor(this);

    this.initActions();

    this.state = STATE.Menu;
    this.newGame = false;
    this.saved = false;

    this.storage.init();
    this.preferences.init();
    this.cube.init();
    this.transition.init();

    this.storage.loadGame();

    setTimeout(() => {
      this.transition.float();
      this.transition.cube(SHOW);

      setTimeout(() => this.transition.title(SHOW), 700);
      setTimeout(
        () => this.transition.buttons(BUTTONS.Menu, BUTTONS.None),
        1000
      );
    }, 500);
  }

  initActions() {
    let tappedTwice = false;

    this.dom.game.addEventListener(
      "click",
      (event) => {
        if (this.transition.activeTransitions > 0) return;
        if (this.state === STATE.Playing) return;

        if (this.state === STATE.Menu) {
          if (!tappedTwice) {
            tappedTwice = true;
            setTimeout(() => (tappedTwice = false), 300);
            return false;
          }

          this.game(SHOW);
        } else if (this.state === STATE.Complete) {
          this.complete(HIDE);
        }
      },
      false
    );

    this.controls.onMove = () => {
      if (this.newGame) {
        this.newGame = false;
      }
    };

    this.dom.buttons.back.onclick = (event) => {
      if (this.transition.activeTransitions > 0) return;

      if (this.state === STATE.Playing) {
        this.game(HIDE);
      } else if (this.state === STATE.Prefs) {
        this.prefs(HIDE);
      } else if (this.state === STATE.Theme) {
        this.theme(HIDE);
      }
    };

    this.dom.buttons.reset.onclick = (event) => {
      if (this.state === STATE.Theme) {
        this.themeEditor.resetTheme();
      }
    };

    this.dom.buttons.prefs.onclick = (event) => this.prefs(SHOW);

    this.dom.buttons.theme.onclick = (event) => this.theme(SHOW);

    this.controls.onSolved = () => this.complete(SHOW);
  }

  _getScrambleFromSolution(solution) {
    const moves = solution.split(" ");
    const reversedAndInvertedMoves = moves.reverse().map((move) => {
      if (move.endsWith("'")) {
        return move.slice(0, -1);
      }
      if (move.endsWith("2")) {
        return move;
      }
      return `${move}'`;
    });
    return reversedAndInvertedMoves.join(" ");
  }
  getNewOutput(sol) {
    // The solution string is space-separated, so we can just split it.
    // return sol.split(' ').filter(move => move !== '');
    let newData = [];
    [...sol].map((data, index) => {
      let st = "";
      if (
        data == "R" ||
        data == "U" ||
        data == "F" ||
        data == "L" ||
        data == "D" ||
        data == "B"
      ) {
        st = st + data;
        if (sol[index + 1] == `'` || sol[index + 1] == "2")
          st = st + sol[index + 1];
        newData.push(st);
      }
    });
    return newData;
  }

  nextButtonEvent() {
    const solutionStepsArray = this.solutionStepsArray;

    this.dom.buttons.next.onclick = (event) => {
      if (presentIndex >= solutionStepsArray.length) {
        this.dom.buttons.next.style.pointerEvents = "none";
        this.dom.buttons.next.style.opacity = "0.5";
        this.dom.buttons.prev.style.pointerEvents = "none";
        this.dom.buttons.prev.style.opacity = "0.5";

        this.dom.texts.step.style.opacity = 0;

        setTimeout(() => {
          this.complete(SHOW);
        }, 500);
        return;
      }
      this.dom.buttons.prev.style.pointerEvents = "none";
      this.dom.buttons.prev.style.opacity = "0.5";
      this.dom.buttons.next.style.pointerEvents = "none";
      this.dom.buttons.next.style.opacity = "0.5";
      const presentStep = solutionStepsArray[presentIndex++];
      const totalSteps = solutionStepsArray.length;

      const prevStep = solutionStepsArray[presentIndex - 2] || "-";
      const currStep = solutionStepsArray[presentIndex - 1] || "Start";
      const nextStep = solutionStepsArray[presentIndex] || "-";
      this.dom.texts.step.querySelector(
        "span"
      ).textContent = `(${presentIndex}/${totalSteps}) Prev: ${prevStep} | Current: ${currStep} | Next: ${nextStep}`;

      this.scrambler.scramble(presentStep);
      this.controls.scrambleCube();
      setTimeout(() => {
        this.dom.buttons.prev.style.pointerEvents = "all";
        this.dom.buttons.prev.style.opacity = "1";
        this.dom.buttons.next.style.pointerEvents = "all";
        this.dom.buttons.next.style.opacity = "1";
      }, 500);
    };
  }

  prevButtonEvent() {
    const solutionStepsArray = this.solutionStepsArray;

    this.dom.buttons.prev.onclick = (event) => {
      if (presentIndex <= 0) {
     
        this.dom.buttons.prev.style.pointerEvents = "none";
        this.dom.buttons.prev.style.opacity = "0.5";
        return;
      }
      this.dom.buttons.prev.style.pointerEvents = "none";
      this.dom.buttons.prev.style.opacity = "0.5";
      this.dom.buttons.next.style.pointerEvents = "none";
      this.dom.buttons.next.style.opacity = "0.5";

      presentIndex--;
      const totalSteps = solutionStepsArray.length;
      const presentStep = solutionStepsArray[presentIndex];
      const invertedStep = this._getScrambleFromSolution(presentStep);

      const prevStep = solutionStepsArray[presentIndex - 2] || "-";
      const currStep = solutionStepsArray[presentIndex - 1] || "Start";
      const nextStep = solutionStepsArray[presentIndex] || "-";
      this.dom.texts.step.querySelector(
        "span"
      ).textContent = `(${presentIndex}/${totalSteps}) Prev: ${prevStep} | Current: ${currStep} | Next: ${nextStep}`;

      this.scrambler.scramble(invertedStep);
      this.controls.scrambleCube();
      setTimeout(() => {
        this.dom.buttons.prev.style.pointerEvents = "all";
        this.dom.buttons.prev.style.opacity = "1";
        this.dom.buttons.next.style.pointerEvents = "all";
        this.dom.buttons.next.style.opacity = "1";
      }, 500);
    };
  }

  game(show) {
    if (show) {
      if (!this.saved) {
        presentIndex = 0; // Reset for new solution
        const solutionStepsArray = this.getNewOutput(solutionSteps);
        this.solutionStepsArray = solutionStepsArray;
        this.dom.buttons.next.style.pointerEvents = "all";
        this.dom.buttons.next.style.opacity = "1";
        this.dom.buttons.prev.style.pointerEvents = "none";
        this.dom.buttons.prev.style.opacity = "0.5";
        const totalSteps = this.solutionStepsArray.length;
        this.dom.texts.step.querySelector(
          "span"
        ).textContent = `(0/${totalSteps}) Prev: - | Current: Start | Next: ${
          this.solutionStepsArray[0] || "-"
        }`;
        scramble = this._getScrambleFromSolution(solutionSteps);
        this.scramble = scramble;
        this.scrambler.scramble(scramble);
        this.controls.scrambleCube();
        this.nextButtonEvent();
        this.prevButtonEvent();
      }

      const duration = this.saved
        ? 0
        : this.scrambler.converted.length * (this.controls.flipSpeeds[0] + 10);

      this.state = STATE.Playing;
      this.saved = true;

      this.transition.buttons(BUTTONS.None, BUTTONS.Menu);

      this.transition.zoom(STATE.Playing, duration);
      this.transition.title(HIDE);
      this.dom.texts.step.style.opacity = 1;

      setTimeout(() => {
        this.controls.enable();
      }, this.transition.durations.zoom);
    } else {
      this.state = STATE.Menu;

      this.transition.buttons(BUTTONS.Menu, BUTTONS.Playing);

      this.transition.zoom(STATE.Menu, 0);

      this.controls.disable();
      this.dom.texts.step.style.opacity = 0;
      this.dom.texts.step.querySelector("span").textContent = "";

      setTimeout(
        () => this.transition.title(SHOW),
        this.transition.durations.zoom - 1000
      );

      this.playing = false;
      this.controls.disable();
    }
  }

  prefs(show) {
    if (show) {
      if (this.transition.activeTransitions > 0) return;

      this.state = STATE.Prefs;

      this.transition.buttons(BUTTONS.Prefs, BUTTONS.Menu);

      this.transition.title(HIDE);
      this.transition.cube(HIDE);

      setTimeout(() => this.transition.preferences(SHOW), 1000);
    } else {
      this.cube.resize();

      this.state = STATE.Menu;

      this.transition.buttons(BUTTONS.Menu, BUTTONS.Prefs);

      this.transition.preferences(HIDE);

      setTimeout(() => this.transition.cube(SHOW), 500);
      setTimeout(() => this.transition.title(SHOW), 1200);
    }
  }

  theme(show) {
    this.themeEditor.colorPicker(show);

    if (show) {
      if (this.transition.activeTransitions > 0) return;

      this.cube.loadFromData(States["3"]["checkerboard"]);

      this.themeEditor.setHSL(null, false);

      this.state = STATE.Theme;

      this.transition.buttons(BUTTONS.Theme, BUTTONS.Prefs);

      this.transition.preferences(HIDE);

      setTimeout(() => this.transition.cube(SHOW, true), 500);
      setTimeout(() => this.transition.theming(SHOW), 1000);
    } else {
      this.state = STATE.Prefs;

      this.transition.buttons(BUTTONS.Prefs, BUTTONS.Theme);

      this.transition.cube(HIDE, true);
      this.transition.theming(HIDE);

      setTimeout(() => this.transition.preferences(SHOW), 1000);
      setTimeout(() => {
        const gameCubeData = JSON.parse(
          localStorage.getItem("theCube_savedState")
        );

        if (!gameCubeData) {
          this.cube.resize(true);
          return;
        }

        this.cube.loadFromData(gameCubeData);
      }, 1500);
    }
  }

  complete(show) {
    if (this.completeTimeout) {
      clearTimeout(this.completeTimeout);
      this.completeTimeout = null;
    }

    if (show) {
      this.transition.buttons(BUTTONS.Complete, BUTTONS.Playing);

      this.state = STATE.Complete;
      this.saved = false;

      this.controls.disable();
      this.storage.clearGame();
      this.transition.zoom(STATE.Menu, 0);
      this.transition.elevate(SHOW);

      setTimeout(() => {
        this.transition.complete(SHOW, this.bestTime);
        this.confetti.start();

        this.completeTimeout = setTimeout(() => {
          this.complete(HIDE);
        }, 4000);
      }, 1000);
    } else {
      this.state = STATE.Menu;
      this.saved = false;
      this.transition.complete(HIDE, this.bestTime);
      this.transition.cube(HIDE);

      setTimeout(() => {
        this.cube.reset();
        this.confetti.stop();
        this.transition.elevate(HIDE);
        this.transition.buttons(BUTTONS.Menu, BUTTONS.Complete);
        this.transition.cube(SHOW);
        this.transition.title(SHOW);
      }, 1000);

      return false;
    }
  }
}

window.game = new Game();
