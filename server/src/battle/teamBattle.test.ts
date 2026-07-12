import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assignTeamForJoin,
  calculatePlanManaCost,
  getActionManaCost,
  getDefaultGridSlots,
  gridSlotToPosition,
  manaForTurn,
  normalizeBattleConfig,
  validateGridSelection,
} from './teamBattle.js';

test('cooperative rooms accept one to three humans on the same team', () => {
  const config = normalizeBattleConfig({ mode: 'coop', expectedPlayers: 9 });
  assert.equal(config.expectedPlayers, 3);
  assert.equal(config.maxClients, 3);
  assert.equal(config.lineupSizePerPlayer, 1);
  assert.equal(config.usesBotOpponent, true);
  assert.equal(assignTeamForJoin(config, 'a', 0), 'blue');
  assert.equal(assignTeamForJoin(config, 'b', 1), 'blue');
});

test('team pvp supports 1v1, 2v2 and 3v3', () => {
  for (const teamSize of [1, 2, 3]) {
    const config = normalizeBattleConfig({ mode: 'team_pvp', teamSize });
    assert.equal(config.expectedPlayers, teamSize * 2);
    assert.equal(config.maxClients, teamSize * 2);
    assert.equal(assignTeamForJoin(config, '', teamSize - 1), 'blue');
    assert.equal(assignTeamForJoin(config, '', teamSize), 'red');
  }
});

test('shared grid rejects collisions, duplicates and invalid slots', () => {
  assert.deepEqual(validateGridSelection([7], [4], 1), { ok: true });
  assert.equal(validateGridSelection([4], [4], 1).ok, false);
  assert.equal(validateGridSelection([7, 7], [], 2).ok, false);
  assert.equal(validateGridSelection([9], [], 1).ok, false);
  assert.equal(validateGridSelection([7, 4], [], 1).ok, false);
});

test('grid rows map to back, middle and front', () => {
  assert.equal(gridSlotToPosition(1), 'back');
  assert.equal(gridSlotToPosition(4), 'mid');
  assert.equal(gridSlotToPosition(7), 'front');
  assert.deepEqual(getDefaultGridSlots(3), [7, 4, 1]);
});

test('mana follows a Hearthstone-like one-to-ten curve', () => {
  assert.equal(manaForTurn(1), 1);
  assert.equal(manaForTurn(6), 6);
  assert.equal(manaForTurn(99), 10);
  assert.equal(getActionManaCost('attack'), 0);
  assert.equal(getActionManaCost('defend'), 0);
  assert.equal(getActionManaCost('spell', 'nova-astral'), 8);
  assert.equal(calculatePlanManaCost({
    a: { action: 'attack' },
    b: { action: 'spell', spellId: 'cure' },
  }), 4);
});
