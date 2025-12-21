// Activity Statistics Module - Calculate and display fitness statistics
// Handles aggregations, charts, milestones, and data analysis

class ActivityStats {
    constructor() {
        this.cachedStats = null;
        this.cacheExpiry = null;
        this.cacheTimeout = 60000; // 1 minute
        
        console.log('[ActivityStats] Initialized');
    }
    
    // Get today's statistics
    async getTodayStats() {
        const today = new Date().toISOString().split('T')[0];
        const stats = await getDailyStats(today);
        
        if (!stats) {
            return {
                date: today,
                totalSteps: 0,
                totalDistance: 0,
                totalCalories: 0,
                totalDuration: 0,
                activities: []
            };
        }
        
        return stats;
    }
    
    // Get weekly statistics (last 7 days)
    async getWeeklyStats() {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 6);
        
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];
        
        const dailyStats = await getStatsForDateRange(startStr, endStr);
        
        return this.aggregateStats(dailyStats);
    }
    
    // Get monthly statistics (last 30 days)
    async getMonthlyStats() {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 29);
        
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];
        
        const dailyStats = await getStatsForDateRange(startStr, endStr);
        
        return this.aggregateStats(dailyStats);
    }
    
    // Get all-time statistics
    async getAllTimeStats() {
        const allActivities = await getAllActivities();
        
        const totalStats = {
            totalActivities: allActivities.length,
            totalSteps: 0,
            totalDistance: 0,
            totalCalories: 0,
            totalDuration: 0,
            byType: {
                walk: { count: 0, distance: 0, duration: 0 },
                run: { count: 0, distance: 0, duration: 0 },
                bike: { count: 0, distance: 0, duration: 0 }
            },
            longestActivity: null,
            longestDistance: 0,
            mostSteps: 0,
            firstActivity: allActivities[allActivities.length - 1]?.startTime || null,
            lastActivity: allActivities[0]?.startTime || null
        };
        
        allActivities.forEach(activity => {
            totalStats.totalSteps += activity.steps || 0;
            totalStats.totalDistance += activity.distance || 0;
            totalStats.totalCalories += activity.calories || 0;
            totalStats.totalDuration += activity.duration || 0;
            
            // Track by type
            const type = activity.type || 'walk';
            if (totalStats.byType[type]) {
                totalStats.byType[type].count++;
                totalStats.byType[type].distance += activity.distance || 0;
                totalStats.byType[type].duration += activity.duration || 0;
            }
            
            // Track records
            if (activity.distance > totalStats.longestDistance) {
                totalStats.longestDistance = activity.distance;
                totalStats.longestActivity = activity;
            }
            
            if (activity.steps > totalStats.mostSteps) {
                totalStats.mostSteps = activity.steps;
            }
        });
        
        return totalStats;
    }
    
    // Aggregate daily stats
    aggregateStats(dailyStats) {
        const aggregated = {
            totalSteps: 0,
            totalDistance: 0,
            totalCalories: 0,
            totalDuration: 0,
            totalActivities: 0,
            avgDailySteps: 0,
            avgDailyDistance: 0,
            days: dailyStats.length,
            dailyBreakdown: []
        };
        
        dailyStats.forEach(day => {
            aggregated.totalSteps += day.totalSteps || 0;
            aggregated.totalDistance += day.totalDistance || 0;
            aggregated.totalCalories += day.totalCalories || 0;
            aggregated.totalDuration += day.totalDuration || 0;
            aggregated.totalActivities += day.activities?.length || 0;
            
            aggregated.dailyBreakdown.push({
                date: day.date,
                steps: day.totalSteps || 0,
                distance: day.totalDistance || 0,
                calories: day.totalCalories || 0
            });
        });
        
        if (aggregated.days > 0) {
            aggregated.avgDailySteps = Math.round(aggregated.totalSteps / aggregated.days);
            aggregated.avgDailyDistance = Math.round(aggregated.totalDistance / aggregated.days);
        }
        
        return aggregated;
    }
    
    // Get activity streak (consecutive days with activities)
    async getActivityStreak() {
        const allActivities = await getAllActivities();
        
        if (allActivities.length === 0) {
            return { current: 0, longest: 0 };
        }
        
        // Group by date
        const dateMap = new Map();
        allActivities.forEach(activity => {
            const date = activity.date || new Date(activity.startTime).toISOString().split('T')[0];
            dateMap.set(date, true);
        });
        
        const dates = Array.from(dateMap.keys()).sort();
        
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 1;
        
        // Check if today has activity
        const today = new Date().toISOString().split('T')[0];
        if (dateMap.has(today)) {
            currentStreak = 1;
        }
        
        // Calculate streaks
        for (let i = dates.length - 1; i > 0; i--) {
            const currentDate = new Date(dates[i]);
            const prevDate = new Date(dates[i - 1]);
            const diffDays = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                tempStreak++;
                if (i === dates.length - 1) {
                    currentStreak = tempStreak;
                }
            } else {
                longestStreak = Math.max(longestStreak, tempStreak);
                tempStreak = 1;
            }
        }
        
        longestStreak = Math.max(longestStreak, tempStreak, currentStreak);
        
        return { current: currentStreak, longest: longestStreak };
    }
    
    // Get goal progress
    async getGoalProgress() {
        const goals = await getActivityGoals();
        const today = await this.getTodayStats();
        
        const progress = [];
        
        goals.forEach(goal => {
            let current = 0;
            let percentage = 0;
            
            switch (goal.type) {
                case 'daily_steps':
                    current = today.totalSteps;
                    percentage = (current / goal.target) * 100;
                    break;
                case 'daily_distance':
                    current = today.totalDistance;
                    percentage = (current / goal.target) * 100;
                    break;
                case 'daily_calories':
                    current = today.totalCalories;
                    percentage = (current / goal.target) * 100;
                    break;
            }
            
            progress.push({
                ...goal,
                current,
                percentage: Math.min(percentage, 100),
                achieved: current >= goal.target
            });
        });
        
        return progress;
    }
    
    // Format duration (seconds to HH:MM:SS)
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }
    
    // Format distance (meters to km)
    formatDistance(meters) {
        const km = meters / 1000;
        return km >= 1 ? `${km.toFixed(2)} km` : `${Math.round(meters)} m`;
    }
    
    // Format pace (min/km)
    formatPace(pace) {
        const minutes = Math.floor(pace);
        const seconds = Math.round((pace - minutes) * 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
    }
    
    // Get chart data for last 7 days
    async getWeeklyChartData() {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 6);
        
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];
        
        const dailyStats = await getStatsForDateRange(startStr, endStr);
        
        // Create complete 7-day array
        const chartData = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            const dateStr = date.toISOString().split('T')[0];
            
            const dayStats = dailyStats.find(s => s.date === dateStr);
            
            chartData.push({
                date: dateStr,
                label: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
                steps: dayStats?.totalSteps || 0,
                distance: dayStats?.totalDistance || 0,
                calories: dayStats?.totalCalories || 0
            });
        }
        
        return chartData;
    }
    
    // Get activity type distribution
    async getActivityTypeDistribution() {
        const allActivities = await getAllActivities();
        
        const distribution = {
            walk: 0,
            run: 0,
            bike: 0
        };
        
        allActivities.forEach(activity => {
            const type = activity.type || 'walk';
            if (distribution[type] !== undefined) {
                distribution[type]++;
            }
        });
        
        return distribution;
    }
    
    // Calculate personal bests
    async getPersonalBests() {
        const allActivities = await getAllActivities();
        
        if (allActivities.length === 0) {
            return null;
        }
        
        const bests = {
            longestDistance: { value: 0, activity: null },
            longestDuration: { value: 0, activity: null },
            mostSteps: { value: 0, activity: null },
            fastestPace: { value: Infinity, activity: null },
            highestSpeed: { value: 0, activity: null }
        };
        
        allActivities.forEach(activity => {
            if (activity.distance > bests.longestDistance.value) {
                bests.longestDistance.value = activity.distance;
                bests.longestDistance.activity = activity;
            }
            
            if (activity.duration > bests.longestDuration.value) {
                bests.longestDuration.value = activity.duration;
                bests.longestDuration.activity = activity;
            }
            
            if (activity.steps > bests.mostSteps.value) {
                bests.mostSteps.value = activity.steps;
                bests.mostSteps.activity = activity;
            }
            
            if (activity.avgPace > 0 && activity.avgPace < bests.fastestPace.value) {
                bests.fastestPace.value = activity.avgPace;
                bests.fastestPace.activity = activity;
            }
            
            if (activity.maxSpeed > bests.highestSpeed.value) {
                bests.highestSpeed.value = activity.maxSpeed;
                bests.highestSpeed.activity = activity;
            }
        });
        
        return bests;
    }
    
    // Export statistics as CSV
    async exportStatsCSV() {
        const allActivities = await getAllActivities();
        
        let csv = 'Date,Type,Duration (s),Distance (m),Steps,Calories,Avg Pace,Max Speed\n';
        
        allActivities.forEach(activity => {
            csv += `${activity.startTime},${activity.type},${activity.duration},${activity.distance},${activity.steps},${activity.calories},${activity.avgPace},${activity.maxSpeed}\n`;
        });
        
        return csv;
    }
    
    // Get summary for voice output
    async getVoiceSummary(language = 'fr') {
        const today = await this.getTodayStats();
        const streak = await getActivityStreak();
        
        const translations = {
            fr: {
                summary: `Aujourd'hui, vous avez fait ${today.totalSteps} pas, parcouru ${this.formatDistance(today.totalDistance)}, et brûlé ${today.totalCalories} calories. Votre série est de ${streak.current} jours.`,
                noActivity: "Aucune activité enregistrée aujourd'hui."
            },
            en: {
                summary: `Today, you've taken ${today.totalSteps} steps, covered ${this.formatDistance(today.totalDistance)}, and burned ${today.totalCalories} calories. Your streak is ${streak.current} days.`,
                noActivity: "No activity recorded today."
            },
            it: {
                summary: `Oggi hai fatto ${today.totalSteps} passi, percorso ${this.formatDistance(today.totalDistance)}, e bruciato ${today.totalCalories} calorie. La tua serie è di ${streak.current} giorni.`,
                noActivity: "Nessuna attività registrata oggi."
            }
        };
        
        const lang = translations[language] || translations.fr;
        
        return today.totalSteps > 0 ? lang.summary : lang.noActivity;
    }
}

// Global instance
const activityStats = new ActivityStats();

// Initialize on load
console.log('[ActivityStats] Module loaded');
