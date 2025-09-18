import Cube from "cubejs";

// The function now takes an initial state string as a parameter.
export default async function solveCube(initialStateString) {
  // Initialize the solver.
  await Cube.initSolver();

  const cube = Cube.fromString(initialStateString);

  // Check if the cube is already solved.
  if (cube.isSolved()) {
    console.log("The provided cube is already solved!");
    return "";
  }
  const solution = await cube.solve();

  if (solution) {
    // Apply the solution to verify it works.
    cube.move(solution);

    return solution;
  } else {
    console.error(
      "Could not find a solution. The state string might be invalid."
    );
  }
}
