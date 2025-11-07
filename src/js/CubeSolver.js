import Cube from "cubejs";
import CubeWorkerConstructor from 'web-worker:./cubeWorker.js';
const cubeWorker = new CubeWorkerConstructor();

cubeWorker.onerror = (event) => {
  console.error("Error loading worker:", event);
};

export default async function solveCube(initialStateString) {

  await Cube.initSolver();

  const cube = Cube.fromString(initialStateString);

  if (cube.isSolved()) {
    const prevButton = document.querySelector(".btn--prev");
    const nextButton = document.querySelector(".btn--next");
    if (prevButton) prevButton.style.opacity = "0";
    if (nextButton) nextButton.style.opacity = "0";
    return "";
  }

  const timeoutPromise = () => new Promise((resolve, reject) =>
    setTimeout(() => {
      reject(new Error("Could not find a solution. The state must be invalid. Resetting the Cube."));
    }, 6000)
  );

  let solution;
  try {
    const workerPromise = new Promise((resolve, reject) => {
      cubeWorker.postMessage({ initialStateString });
      cubeWorker.onmessage = (event) => {
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data.solution);
        }
      };
      cubeWorker.onerror = (event) => {
        console.error("Error from worker's internal execution (main thread):", event);
        reject(new Error(`Worker execution error: ${event.message}`));
      };
    });

    solution = await Promise.race([timeoutPromise(), workerPromise]);
  } catch (error) {
    console.error("Error during cube solving:", error.message);
    throw error; // Re-throw the error to be handled by the caller
  }

  if (solution) {
    return solution;
  } else {
    console.error(
      "Could not find a solution. The state must be invalid."
    );
  }
}