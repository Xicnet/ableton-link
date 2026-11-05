const { AbletonLink } = require('../index');

describe('AbletonLink', () => {
  let link;

  beforeEach(() => {
    link = new AbletonLink(120.0);
  });

  afterEach(() => {
    if (link && link.isEnabled()) {
      link.enable(false);
    }
  });

  test('should create instance with initial tempo', () => {
    expect(link).toBeDefined();
    expect(link.getTempo()).toBe(120.0);
  });

  test('should enable and disable Link', () => {
    expect(link.isEnabled()).toBe(false);

    link.enable(true);
    expect(link.isEnabled()).toBe(true);

    link.enable(false);
    expect(link.isEnabled()).toBe(false);
  });

  test('should set and get tempo', () => {
    link.setTempo(128.0);
    expect(link.getTempo()).toBe(128.0);
  });

  test('should get beat and phase', () => {
    const beat = link.getBeat();
    expect(typeof beat).toBe('number');
    expect(beat).toBeGreaterThanOrEqual(0);

    const phase = link.getPhase(4.0);
    expect(typeof phase).toBe('number');
    expect(phase).toBeGreaterThanOrEqual(0);
    expect(phase).toBeLessThan(4.0);
  });

  test('should get number of peers', () => {
    const peers = link.getNumPeers();
    expect(typeof peers).toBe('number');
    expect(peers).toBeGreaterThanOrEqual(0);
  });

  test('should control playing state', () => {
    link.setIsPlaying(true);
    expect(link.isPlaying()).toBe(true);

    link.setIsPlaying(false);
    expect(link.isPlaying()).toBe(false);
  });

  test('setIsPlaying(playing, atTimeSeconds) commits the transition at that time', () => {
    const at = link.getCurrentTime() + 2.5;

    link.setIsPlaying(true, at);
    expect(link.isPlaying()).toBe(true);
    expect(Math.abs(link.timeForIsPlaying() - at)).toBeLessThan(1e-5);

    link.setIsPlaying(false, at + 1);
    expect(link.isPlaying()).toBe(false);
    expect(Math.abs(link.timeForIsPlaying() - (at + 1))).toBeLessThan(1e-5);
  });

  test('setIsPlaying without a time commits at the current time (unchanged)', () => {
    const before = link.getCurrentTime();
    link.setIsPlaying(true);
    const after = link.getCurrentTime();
    const t = link.timeForIsPlaying();
    expect(t).toBeGreaterThanOrEqual(before - 1e-5);
    expect(t).toBeLessThanOrEqual(after + 1e-5);

    link.setIsPlaying(false, undefined);
    expect(link.timeForIsPlaying()).toBeGreaterThanOrEqual(after - 1e-5);
  });

  test('setIsPlaying refuses a non-finite or non-numeric time and leaves the state alone', () => {
    const at = link.getCurrentTime() + 2.5;
    link.setIsPlaying(true, at);

    // Matched by message: the addon's errors are built in the native realm, so their
    // constructors are not Jest's RangeError / TypeError.
    expect(() => link.setIsPlaying(false, NaN)).toThrow(/finite number of Link clock seconds/);
    expect(() => link.setIsPlaying(false, Infinity)).toThrow(/finite number of Link clock seconds/);
    expect(() => link.setIsPlaying(false, '1')).toThrow(
      /Time \(number, Link clock seconds\) expected/
    );
    expect(link.isPlaying()).toBe(true);
    expect(Math.abs(link.timeForIsPlaying() - at)).toBeLessThan(1e-5);
  });

  test('should enable start/stop sync', () => {
    expect(link.isStartStopSyncEnabled()).toBe(false);

    link.enableStartStopSync(true);
    expect(link.isStartStopSyncEnabled()).toBe(true);

    link.enableStartStopSync(false);
    expect(link.isStartStopSyncEnabled()).toBe(false);
  });

  test('should set callbacks', () => {
    const numPeersCallback = jest.fn();
    const tempoCallback = jest.fn();
    const startStopCallback = jest.fn();

    // These should not throw
    link.setNumPeersCallback(numPeersCallback);
    link.setTempoCallback(tempoCallback);
    link.setStartStopCallback(startStopCallback);

    expect(true).toBe(true); // If we get here, no errors were thrown
  });

  test('should handle quantized methods', () => {
    const currentTime = Date.now() / 1000;

    // These should not throw
    link.requestBeatAtTime(0, currentTime + 1, 4.0);
    link.requestBeatAtStartPlayingTime(0, 4.0);
    link.setIsPlayingAndRequestBeatAtTime(true, currentTime + 1, 0, 4.0);

    const timeForPlaying = link.timeForIsPlaying();
    expect(typeof timeForPlaying).toBe('number');
  });

  test('should force beat at time', () => {
    const currentTime = Date.now() / 1000;

    // Should not throw
    link.forceBeatAtTime(0, currentTime, 4.0);

    const timeForBeat = link.getTimeForBeat(4, 4.0);
    expect(typeof timeForBeat).toBe('number');
  });
});
