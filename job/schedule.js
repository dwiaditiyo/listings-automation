import cron from 'node-cron'
import { poshmarkTrack, fashionphileTrack } from '../controllers/trackingController.js'

export const runJob = ()=> {

    try {
        
        cron.schedule('0 0 */2 * * *', () => {
            console.log("running a task every 2 hours")
            poshmarkTrack()
        })
        
        cron.schedule('0 0 */12 * * *', () => {
            console.log("running a task every 12 hours")
            fashionphileTrack()
        })

    } catch (error) {
        console.log(error.message);
    }
}