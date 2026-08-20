
import { getAutocompletionResult, INITIAL_STATE } from './src/game/commandParser';
const state = { ...INITIAL_STATE, discoveredNodeIps: ['192.168.0.1', '192.168.0.14', '192.168.0.88'] };

console.log('Test 1 - IP partial expansion:');
console.log(getAutocompletionResult('crack 192.168.0.', state));

console.log('
Test 2 - Exploit list after IP + space:');
console.log(getAutocompletionResult('crack 192.168.0.1 ', state));

console.log('
Test 3 - Single exploit complete:');
console.log(getAutocompletionResult('crack 192.168.0.1 p', state));

console.log('
Test 4 - Command complete:');
console.log(getAutocompletionResult('sc', state));
