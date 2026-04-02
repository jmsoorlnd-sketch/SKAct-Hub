import cron from "node-cron";
import Message from "../models/MessageModel.js";

/**
 * Scheduler service for automatically updating event statuses based on current time
 */
class EventStatusScheduler {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Start the scheduler
   */
  start() {
    if (this.isRunning) {
      console.log("Event status scheduler is already running");
      return;
    }

    // Run every minute
    cron.schedule("* * * * *", async () => {
      try {
        await this.updateEventStatuses();
      } catch (error) {
        console.error("Error in event status scheduler:", error);
      }
    });

    this.isRunning = true;
    console.log("Event status scheduler started - runs every minute");
  }

  /**
   * Update event statuses based on current time
   */
  async updateEventStatuses() {
    const now = new Date();

    try {
      // Find events that should be ongoing (start time has passed, end time hasn't or no end time)
      const eventsToStart = await Message.find({
        startDate: { $lte: now },
        $or: [
          { endDate: { $gt: now } },
          { endDate: null },
          { endDate: { $exists: false } },
        ],
        status: { $in: ["pending", "approved"] },
        isDeleted: false,
      });

      // Update events to ongoing
      if (eventsToStart.length > 0) {
        await Message.updateMany(
          { _id: { $in: eventsToStart.map((e) => e._id) } },
          { status: "ongoing" },
        );
        console.log(
          `Updated ${eventsToStart.length} events to 'ongoing' status`,
        );
      }

      // Find events that should be completed (end time has passed)
      const eventsToComplete = await Message.find({
        endDate: { $lte: now },
        status: { $in: ["pending", "approved", "ongoing"] },
        isDeleted: false,
      });

      // Update events to completed
      if (eventsToComplete.length > 0) {
        await Message.updateMany(
          { _id: { $in: eventsToComplete.map((e) => e._id) } },
          { status: "completed" },
        );
        console.log(
          `Updated ${eventsToComplete.length} events to 'completed' status`,
        );
      }
    } catch (error) {
      console.error("Error updating event statuses:", error);
    }
  }

  /**
   * Stop the scheduler
   */
  stop() {
    // Note: node-cron doesn't provide a direct way to stop all schedules
    // This would require keeping track of scheduled tasks and destroying them
    this.isRunning = false;
    console.log("Event status scheduler stopped");
  }
}

export default new EventStatusScheduler();
