//@ts-check
import { System } from "../world.js";
import engine from "../engine.js";

const nameSize = "12px";//"18px";

export default class UserUI extends System {
    /** @param {import("../world").UserObject} user */
    process(user) {
        if (user.type != 'char') return;
        const userData = /** @type {import("../world").UserData} */ (user.components.userData);
        const sprite = user.components.sprite;
        if (!userData || !sprite) return;

        engine.requestUIDraw({
            depth: sprite.depth,
            /** @param {{c: HTMLCanvasElement, ctx: CanvasRenderingContext2D}} param0 */
            f: ({ c, ctx }) => {
                try {
                    ctx.lineWidth = 0.5;
                    ctx.strokeStyle = 'black';

                    let metrics = ctx.measureText(userData.name);
                    let textWidth = metrics.width;
                    const pos = {
                        x: Math.ceil(user.components.position.x - ((textWidth - user.components.size.width) / 2)),
                        y: Math.ceil(engine.canvas.height - (user.components.position.y - engine.options.charNameOffset))
                    };

                    ctx.fillStyle = 'white';
                    ctx.font = `300 ${nameSize} customFont`;

                    ctx.fillText(userData.name, pos.x, pos.y);
                } catch (error) {
                    console.error(error);
                }
            }
        });
    }
}
