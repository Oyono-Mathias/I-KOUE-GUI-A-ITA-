const test = require('node:test');
const assert = require('node:assert/strict');
const { canCreateMember } = require('../lib/authorization');

test('allows the four approved executive/secretary roles', () => {
  for (const role of ['president', 'president_fondateur', 'secretaire_general', 'secretaire', 'super_admin']) {
    assert.equal(canCreateMember(role, 'actif'), true, role);
  }
});

test('rejects ordinary and unrelated privileged roles', () => {
  for (const role of ['membre', 'member', 'vice_president', 'tresorier', 'admin', null, undefined]) {
    assert.equal(canCreateMember(role, 'actif'), false, String(role));
  }
});

test('rejects every approved role when the caller is suspended', () => {
  for (const role of ['president', 'president_fondateur', 'secretaire_general', 'secretaire', 'super_admin']) {
    assert.equal(canCreateMember(role, 'suspendu'), false, role);
  }
});
