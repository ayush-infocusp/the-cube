import Cube from "cubejs";

self.onmessage = async (event) => {
    const { initialStateString } = event.data;
    try {
        await Cube.initSolver();
        const cube = Cube.fromString(initialStateString);
        const solution = await cube.solve();
        
        self.postMessage({ solution });
    } catch (error) {
        self.postMessage({ error: error.message });
    }
};
