/** 
 * @typedef {Object} PosOffset
 * @property {number} [x]
 * @property {number} [y] 
 * 
 * @typedef {Object} ExceptionsData
 * @property {Object.<string, Array<string>>} keys
 * @property {boolean} replaceParent
 * @property {AnimationPartData} part
 * 
 * @typedef {Object} AnimationPartSet
 * @property {number} keyframe
 * @property {string} [texture]
 * @property {number} [useSpriteFrame]
 * @property {PosOffset} [posOffset]
 * @property {number}  [rotation]
 * 
 * @typedef {Object} AnimationPartData
 * @property {string} [texture]
 * @property {PosOffset} [posOffset]
 * @property {import("./general").Position} [rotationPivot]
 * @property {Array<AnimationPartSet>} sets
 * @property {Array<ExceptionsData>} [exceptions]
 * 
 * @typedef {Object.<string, AnimationPartData>} AnimationParts
 * 
 * 
 * @typedef {Object} AnimationMainStruct
 * @property {number} duration
 * @property {Array<string>} [emitOnEnd]
 * @property {Array<string>} [emitOnStart]
 * @property {Object.<string, AnimationParts>} parts
 * 
 */

export default {};