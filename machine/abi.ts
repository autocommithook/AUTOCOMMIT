import { parseAbi } from 'viem';
export const abi = parseAbi([
  'event BuildStarted(uint256 indexed buildId, bytes32 genesisTapeHash)',
  'event AuthorAdded(uint256 indexed buildId, address indexed author, uint256 authorCount)',
  'event InstructionWritten(address indexed trader, uint8 opcode, uint256 index, bytes32 newTapeHash)',
  'event InstructionEdited(address indexed trader, uint8 editType, uint256 targetIndex, uint8 opcode, bytes32 newTapeHash)',
  'event ProgramSealed(uint256 indexed buildId, bytes32 programHash, address finalizer)',
  'function getTape() view returns (uint8[])',
  'function buildState() view returns (uint256 buildId, bytes32 currentHash, uint256 length, uint256 authors, bool sealable)',
  'function sealedBuild(uint256 buildId) view returns (bytes32 programHash, address finalizer, uint256 length)',
  'function genesisTape() view returns (bytes32)',
]);
