class Storage {
  constructor(game) {
    this.game = game;

    const userVersion = null 
    // localStorage.getItem("theCube_version");

    if (!userVersion || userVersion !== window.gameVersion) {
      this.clearGame();
      this.clearPreferences();
    }
  }

  init() {
    this.loadPreferences();
  }

  loadGame() {
    return;
  }

  saveGame() {
    return;
  }

  clearGame() {
    localStorage.removeItem("theCube_playing");
    localStorage.removeItem("theCube_savedState");
    localStorage.removeItem("theCube_time");
  }

  loadPreferences() {
    try {
      const preferences = JSON.parse(
        localStorage.getItem("theCube_preferences")
      );

      if (!preferences) throw new Error();

      this.game.cube.size = parseInt(preferences.cubeSize);
      this.game.controls.flipConfig = parseInt(preferences.flipConfig);
      this.game.scrambler.dificulty = parseInt(preferences.dificulty);

      this.game.world.fov = parseFloat(preferences.fov);
      this.game.world.resize();

      this.game.themes.colors = preferences.colors;
      this.game.themes.setTheme(preferences.theme);

      return true;
    } catch (e) {
      this.game.cube.size = 3;
      this.game.controls.flipConfig = 0;
      this.game.scrambler.dificulty = 1;

      this.game.world.fov = 10;
      this.game.world.resize();

      this.game.themes.setTheme("cube");

      this.savePreferences();

      return false;
    }
  }

  savePreferences() {
    const preferences = {
      cubeSize: this.game.cube.size,
      flipConfig: this.game.controls.flipConfig,
      dificulty: this.game.scrambler.dificulty,
      fov: this.game.world.fov,
      theme: this.game.themes.theme,
      colors: this.game.themes.colors,
    };

    localStorage.setItem("theCube_preferences", JSON.stringify(preferences));
  }

  clearPreferences() {
    localStorage.removeItem("theCube_preferences");
  }
}

export { Storage };
