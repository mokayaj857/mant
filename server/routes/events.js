import express from 'express';
import { insertEvent, getAllEvents, getEventById, updateEvent, deleteEvent } from '../utils/database.js';

const router = express.Router();

// Create new event
router.post('/', async (req, res) => {
    try {
        const eventData = req.body;

        // Validate required fields
        if (!eventData.eventName || !eventData.eventDate || !eventData.venue) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: eventName, eventDate, venue'
            });
        }

        const eventId = insertEvent(eventData);

        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            eventId: eventId,
            data: getEventById(eventId)
        });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create event',
            details: error.message
        });
    }
});

// Get all events
router.get('/', async (req, res) => {
    try {
        const events = getAllEvents();
        res.json({
            success: true,
            count: events.length,
            data: events
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch events',
            details: error.message
        });
    }
});

// Get event by ID
router.get('/:id', async (req, res) => {
    try {
        const event = getEventById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }

        res.json({
            success: true,
            data: event
        });
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch event',
            details: error.message
        });
    }
});

// Update event
router.put('/:id', async (req, res) => {
    try {
        const eventData = req.body;
        const changes = updateEvent(req.params.id, eventData);

        if (changes === 0) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }

        res.json({
            success: true,
            message: 'Event updated successfully',
            data: getEventById(req.params.id)
        });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update event',
            details: error.message
        });
    }
});

// Delete event
router.delete('/:id', async (req, res) => {
    try {
        const changes = deleteEvent(req.params.id);

        if (changes === 0) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }

        res.json({
            success: true,
            message: 'Event deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete event',
            details: error.message
        });
    }
});

export default router;
