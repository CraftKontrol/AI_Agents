const { Notification } = require('electron');
const log = require('electron-log');

/**
 * MonitoringService - Background daemon for desktop app
 * Equivalent to Android MonitoringService
 * 
 * Responsibilities:
 * - Check scheduled alarms every 30 seconds
 * - Monitor activity tracking data
 * - Send notifications for reminders/alarms
 * - Update tray icon with status
 */
class MonitoringService {
  constructor(store) {
    this.store = store;
    this.isActive = false;
    this.alarmCheckInterval = null;
    this.activityCheckInterval = null;
    this.scheduledAlarms = new Map(); // alarmId -> { title, timestamp, type, notified }
  }

  /**
   * Start the monitoring service
   */
  async start() {
    if (this.isActive) {
      log.warn('MonitoringService already running');
      return;
    }

    this.isActive = true;
    log.info('MonitoringService started');

    // Load saved alarms
    this.loadAlarms();

    // Start alarm checking (every 30 seconds)
    this.alarmCheckInterval = setInterval(() => {
      this.checkAlarms();
    }, 30000);

    // Start activity checking (every 2 minutes)
    this.activityCheckInterval = setInterval(() => {
      this.checkActivityTracking();
    }, 120000);

    // Initial check
    this.checkAlarms();
    this.checkActivityTracking();
  }

  /**
   * Stop the monitoring service
   */
  stop() {
    if (!this.isActive) return;

    this.isActive = false;
    
    if (this.alarmCheckInterval) {
      clearInterval(this.alarmCheckInterval);
      this.alarmCheckInterval = null;
    }
    
    if (this.activityCheckInterval) {
      clearInterval(this.activityCheckInterval);
      this.activityCheckInterval = null;
    }

    // Save alarms before stopping
    this.saveAlarms();
    
    log.info('MonitoringService stopped');
  }

  /**
   * Restart the monitoring service
   */
  async restart() {
    this.stop();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.start();
  }

  /**
   * Check if service is running
   */
  isRunning() {
    return this.isActive;
  }

  /**
   * Schedule a new alarm
   */
  scheduleAlarm(alarmData) {
    const { id, title, timestamp, type } = alarmData;
    
    this.scheduledAlarms.set(id, {
      title,
      timestamp: new Date(timestamp),
      type: type || 'reminder',
      notified: false
    });

    this.saveAlarms();
    log.info(`Alarm scheduled: ${id} - ${title} at ${timestamp}`);
  }

  /**
   * Cancel an alarm
   */
  cancelAlarm(alarmId) {
    if (this.scheduledAlarms.has(alarmId)) {
      this.scheduledAlarms.delete(alarmId);
      this.saveAlarms();
      log.info(`Alarm cancelled: ${alarmId}`);
    }
  }

  /**
   * Check all scheduled alarms
   */
  checkAlarms() {
    if (!this.isActive) return;

    const now = new Date();
    
    for (const [alarmId, alarm] of this.scheduledAlarms.entries()) {
      // Check if alarm time has passed and not yet notified
      if (alarm.timestamp <= now && !alarm.notified) {
        this.triggerAlarm(alarmId, alarm);
        
        // Mark as notified
        alarm.notified = true;
        
        // Remove alarm after notification (one-time alarms)
        this.scheduledAlarms.delete(alarmId);
        this.saveAlarms();
      }
      
      // Check for pre-reminder (15 minutes before)
      const preReminderTime = new Date(alarm.timestamp.getTime() - 15 * 60 * 1000);
      if (now >= preReminderTime && now < alarm.timestamp && !alarm.preNotified) {
        this.triggerPreReminder(alarmId, alarm);
        alarm.preNotified = true;
      }
    }
  }

  /**
   * Trigger an alarm notification
   */
  triggerAlarm(alarmId, alarm) {
    log.info(`Alarm triggered: ${alarmId} - ${alarm.title}`);
    
    const emoji = this.getAlarmEmoji(alarm.type);
    
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: `${emoji} ${alarm.title}`,
        body: `Reminder: ${alarm.title}`,
        urgency: 'critical',
        timeoutType: 'never',
        sound: 'default'
      });
      
      notification.show();
      
      notification.on('click', () => {
        // Could open Memory Board app here
        log.info(`Alarm notification clicked: ${alarmId}`);
      });
    }
  }

  /**
   * Trigger a pre-reminder (15 minutes before)
   */
  triggerPreReminder(alarmId, alarm) {
    log.info(`Pre-reminder triggered: ${alarmId}`);
    
    if (Notification.isSupported()) {
      new Notification({
        title: '⏰ Upcoming Reminder',
        body: `In 15 minutes: ${alarm.title}`,
        urgency: 'normal'
      }).show();
    }
  }

  /**
   * Get emoji for alarm type
   */
  getAlarmEmoji(type) {
    const emojiMap = {
      'medicine': '💊',
      'medication': '💊',
      'appointment': '📅',
      'doctor': '👨‍⚕️',
      'reminder': '⏰',
      'task': '✓',
      'default': '🔔'
    };
    
    return emojiMap[type?.toLowerCase()] || emojiMap.default;
  }

  /**
   * Check activity tracking status
   */
  checkActivityTracking() {
    if (!this.isActive) return;

    const activityData = this.store.get('activityData', {
      trackingEnabled: false,
      todaySteps: 0,
      lastUpdate: 0
    });

    // Note: Desktop doesn't have accelerometer/gyroscope
    // This is mainly for monitoring data synced from web apps
    if (activityData.trackingEnabled) {
      const lastUpdate = new Date(activityData.lastUpdate);
      const now = new Date();
      const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);

      // If data is stale (>24 hours), show reminder to use mobile app
      if (hoursSinceUpdate > 24) {
        log.info('Activity tracking data is stale');
        
        if (Notification.isSupported()) {
          new Notification({
            title: '🚶 Activity Tracking',
            body: 'No activity data today. Use the mobile app for step tracking.',
            urgency: 'low'
          }).show();
        }
      }
    }
  }

  /**
   * Load alarms from storage
   */
  loadAlarms() {
    const savedAlarms = this.store.get('alarms', []);
    
    this.scheduledAlarms.clear();
    
    savedAlarms.forEach(alarm => {
      this.scheduledAlarms.set(alarm.id, {
        title: alarm.title,
        timestamp: new Date(alarm.timestamp),
        type: alarm.type,
        notified: alarm.notified || false,
        preNotified: alarm.preNotified || false
      });
    });
    
    log.info(`Loaded ${this.scheduledAlarms.size} alarms from storage`);
  }

  /**
   * Save alarms to storage
   */
  saveAlarms() {
    const alarmsArray = Array.from(this.scheduledAlarms.entries()).map(([id, alarm]) => ({
      id,
      title: alarm.title,
      timestamp: alarm.timestamp.toISOString(),
      type: alarm.type,
      notified: alarm.notified,
      preNotified: alarm.preNotified
    }));
    
    this.store.set('alarms', alarmsArray);
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isActive: this.isActive,
      alarmCount: this.scheduledAlarms.size,
      nextAlarm: this.getNextAlarm()
    };
  }

  /**
   * Get next scheduled alarm
   */
  getNextAlarm() {
    if (this.scheduledAlarms.size === 0) return null;
    
    let nextAlarm = null;
    let nextTime = null;
    
    for (const [id, alarm] of this.scheduledAlarms.entries()) {
      if (!alarm.notified) {
        if (!nextTime || alarm.timestamp < nextTime) {
          nextTime = alarm.timestamp;
          nextAlarm = { id, ...alarm };
        }
      }
    }
    
    return nextAlarm;
  }
}

module.exports = MonitoringService;
