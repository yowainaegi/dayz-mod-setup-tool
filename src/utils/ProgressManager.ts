export default class ProgressManager {
    private taskProgress: Map<string, number> = new Map();
    private totalTasks: number;
    private onProgressChange: (progress: number) => void;

    constructor(totalTasks: number, onProgressChange: (progress: number) => void) {
        this.totalTasks = totalTasks;
        this.onProgressChange = onProgressChange;
    }

    updateProgress(taskId: string, progress: number) {
        this.taskProgress.set(taskId, progress);
        this.displayTotalProgress();
    }

    private displayTotalProgress() {
        let totalProgress = 0;
        this.taskProgress.forEach((progress) => {
            totalProgress += progress;
        });

        const overallProgress = this.totalTasks === 0 ? 100 : totalProgress / this.totalTasks;
        this.onProgressChange(Math.round(overallProgress * 10) / 10);
    }
}
