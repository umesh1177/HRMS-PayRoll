/**
 * Working Schedules & Shifts Controller
 * 
 * RESPONSIBILITY:
 * Manages working schedule templates and nested schedule lines (daily shift timings).
 * Automatically calculates and maintains `total_weekly_hours` on working_schedules.
 * 
 * NOT RESPONSIBLE FOR:
 * Daily employee check-in recording (handled by attendanceController.js).
 */

const pool = require('../config/db');

/**
 * Helper function to calculate total weekly hours from schedule lines.
 * 
 * @param {Array<{ start_time: string, end_time: string, break_minutes?: number }>} lines - Schedule lines
 * @returns {number} Total weekly hours
 */
function calculateWeeklyHours(lines) {
  if (!Array.isArray(lines) || lines.length === 0) return 0;
  let totalMinutes = 0;

  for (const line of lines) {
    if (!line.start_time || !line.end_time) continue;
    const [startH, startM] = line.start_time.split(':').map(Number);
    const [endH, endM] = line.end_time.split(':').map(Number);

    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;
    const breakM = Number(line.break_minutes) || 0;

    const diff = Math.max(0, endTotal - startTotal - breakM);
    totalMinutes += diff;
  }

  return Number((totalMinutes / 60).toFixed(2));
}

/**
 * Lists working schedules.
 */
async function listSchedules(req, res, next) {
  try {
    const [schedules] = await pool.query(`
      SELECT 
        ws.id, 
        ws.name, 
        ws.schedule_type, 
        ws.total_weekly_hours, 
        ws.status, 
        ws.created_at,
        COUNT(sl.id) AS lines_count
      FROM working_schedules ws
      LEFT JOIN schedule_lines sl ON ws.id = sl.schedule_id
      GROUP BY ws.id
      ORDER BY ws.id ASC
    `);

    const [allLines] = await pool.query(
      'SELECT id, schedule_id, day_of_week, start_time, end_time, break_minutes FROM schedule_lines ORDER BY FIELD(day_of_week, "mon","tue","wed","thu","fri","sat","sun")'
    );

    const schedulesWithLines = schedules.map((s) => ({
      ...s,
      lines: allLines.filter((l) => l.schedule_id === s.id)
    }));

    res.status(200).json({ data: schedulesWithLines });
  } catch (err) {
    next(err);
  }
}

/**
 * Gets a working schedule by ID with all nested schedule_lines.
 */
async function getScheduleById(req, res, next) {
  try {
    const { id } = req.params;
    const [schedules] = await pool.query('SELECT * FROM working_schedules WHERE id = ?', [id]);
    if (schedules.length === 0) {
      const error = new Error(`Schedule with ID ${id} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    const [lines] = await pool.query(
      'SELECT id, day_of_week, start_time, end_time, break_minutes FROM schedule_lines WHERE schedule_id = ? ORDER BY FIELD(day_of_week, "mon","tue","wed","thu","fri","sat","sun")',
      [id]
    );

    res.status(200).json({
      data: {
        ...schedules[0],
        lines
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Creates a working schedule along with its daily schedule lines in an atomic transaction.
 */
async function createSchedule(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { name, schedule_type, lines } = req.body;
    if (!name) {
      const error = new Error('Schedule name is required');
      error.status = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    const weeklyHours = calculateWeeklyHours(lines || []);

    await connection.beginTransaction();

    const [schResult] = await connection.query(
      'INSERT INTO working_schedules (name, schedule_type, total_weekly_hours, status) VALUES (?, ?, ?, ?)',
      [name, schedule_type || 'full_time', weeklyHours, 'active']
    );

    const scheduleId = schResult.insertId;

    if (Array.isArray(lines) && lines.length > 0) {
      const lineValues = lines.map((l) => [
        scheduleId,
        l.day_of_week,
        l.start_time,
        l.end_time,
        l.break_minutes || 0
      ]);

      await connection.query(
        'INSERT INTO schedule_lines (schedule_id, day_of_week, start_time, end_time, break_minutes) VALUES ?',
        [lineValues]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: 'Working schedule created successfully',
      data: {
        id: scheduleId,
        name,
        schedule_type: schedule_type || 'full_time',
        total_weekly_hours: weeklyHours,
        lines: lines || []
      }
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
}

/**
 * Updates a working schedule and replaces its schedule lines.
 */
async function updateSchedule(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { name, schedule_type, status, lines } = req.body;

    const [existing] = await connection.query('SELECT id FROM working_schedules WHERE id = ?', [id]);
    if (existing.length === 0) {
      const error = new Error(`Schedule with ID ${id} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    await connection.beginTransaction();

    let weeklyHours = null;
    if (Array.isArray(lines)) {
      weeklyHours = calculateWeeklyHours(lines);
      // Replace schedule lines
      await connection.query('DELETE FROM schedule_lines WHERE schedule_id = ?', [id]);
      if (lines.length > 0) {
        const lineValues = lines.map((l) => [
          id,
          l.day_of_week,
          l.start_time,
          l.end_time,
          l.break_minutes || 0
        ]);
        await connection.query(
          'INSERT INTO schedule_lines (schedule_id, day_of_week, start_time, end_time, break_minutes) VALUES ?',
          [lineValues]
        );
      }
    }

    await connection.query(
      `UPDATE working_schedules 
       SET name = COALESCE(?, name), 
           schedule_type = COALESCE(?, schedule_type),
           status = COALESCE(?, status),
           total_weekly_hours = COALESCE(?, total_weekly_hours)
       WHERE id = ?`,
      [name, schedule_type, status, weeklyHours, id]
    );

    await connection.commit();
    res.status(200).json({ message: 'Working schedule updated successfully' });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
}

/**
 * Completely removes a working schedule and unlinks referenced records in the database.
 */
async function deleteSchedule(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;

    const [existing] = await connection.query('SELECT id FROM working_schedules WHERE id = ?', [id]);
    if (existing.length === 0) {
      const error = new Error(`Schedule with ID ${id} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    await connection.beginTransaction();

    // 1. Unlink schedule from employees and contracts
    await connection.query('UPDATE employees SET working_schedule_id = NULL WHERE working_schedule_id = ?', [id]);
    await connection.query('UPDATE contracts SET working_schedule_id = NULL WHERE working_schedule_id = ?', [id]);

    // 2. Delete schedule lines
    await connection.query('DELETE FROM schedule_lines WHERE schedule_id = ?', [id]);

    // 3. Delete the working schedule
    await connection.query('DELETE FROM working_schedules WHERE id = ?', [id]);

    await connection.commit();
    res.status(200).json({ message: 'Working schedule permanently deleted from database' });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
}

module.exports = {
  listSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule
};
