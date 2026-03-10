import React, { useState } from 'react';
import {
  Target, ChevronDown, ChevronRight, Plus, Trash2, Check,
  Circle, CheckCircle2, RotateCcw
} from 'lucide-react';

export default function TeamTaskBoard({ steps, isLeader, onAddStep, onUpdateStep, onDeleteStep, onAddTask, onUpdateTask, onDeleteTask, teamGoal }) {
  const [expandedSteps, setExpandedSteps] = useState({});
  const [newStepName, setNewStepName] = useState('');
  const [addingStep, setAddingStep] = useState(false);
  const [newTaskNames, setNewTaskNames] = useState({});
  const [addingTask, setAddingTask] = useState({});

  const toggleStep = (stepId) => {
    setExpandedSteps(prev => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const handleAddStep = async (e) => {
    e.preventDefault();
    if (!newStepName.trim()) return;
    await onAddStep(newStepName.trim());
    setNewStepName('');
    setAddingStep(false);
  };

  const handleAddTask = async (stepId) => {
    const name = (newTaskNames[stepId] || '').trim();
    if (!name) return;
    await onAddTask(stepId, name);
    setNewTaskNames(prev => ({ ...prev, [stepId]: '' }));
    setAddingTask(prev => ({ ...prev, [stepId]: false }));
  };

  const pendingSteps = steps.filter(s => s.status === 'pending');
  const completedSteps = steps.filter(s => s.status === 'completed');

  return (
    <div className="task-board">
      {/* Team Goal */}
      <div className="task-board-goal">
        <div className="task-board-goal-icon">
          <Target size={20} />
        </div>
        <div>
          <div className="task-board-goal-label">Team Goal</div>
          <div className="task-board-goal-text">{teamGoal}</div>
        </div>
      </div>

      {/* Progress */}
      {steps.length > 0 && (
        <div className="task-board-progress">
          <div className="task-board-progress-bar">
            <div
              className="task-board-progress-fill"
              style={{ width: `${steps.length ? (completedSteps.length / steps.length) * 100 : 0}%` }}
            />
          </div>
          <span className="task-board-progress-text">
            {completedSteps.length}/{steps.length} steps completed
          </span>
        </div>
      )}

      {/* Pending Steps */}
      <div className="task-board-section">
        <h3 className="task-board-section-title">
          <Circle size={14} style={{ color: 'var(--blue)' }} />
          Active Steps ({pendingSteps.length})
        </h3>
        {pendingSteps.map(step => (
          <StepCard
            key={step._id}
            step={step}
            expanded={expandedSteps[step._id]}
            onToggle={() => toggleStep(step._id)}
            isLeader={isLeader}
            isCompleted={false}
            onUpdateStep={onUpdateStep}
            onDeleteStep={onDeleteStep}
            onAddTask={onAddTask}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
            newTaskName={newTaskNames[step._id] || ''}
            onNewTaskNameChange={(val) => setNewTaskNames(prev => ({ ...prev, [step._id]: val }))}
            addingTask={addingTask[step._id]}
            setAddingTask={(val) => setAddingTask(prev => ({ ...prev, [step._id]: val }))}
            handleAddTask={() => handleAddTask(step._id)}
          />
        ))}
      </div>

      {/* Add Step */}
      {isLeader && (
        <div className="task-board-add-step">
          {addingStep ? (
            <form onSubmit={handleAddStep} className="task-board-add-step-form">
              <input
                value={newStepName}
                onChange={e => setNewStepName(e.target.value)}
                placeholder="Step name..."
                autoFocus
                maxLength={200}
              />
              <button type="submit" className="btn btn-primary btn-sm">Add</button>
              <button type="button" className="btn btn-light btn-sm" onClick={() => { setAddingStep(false); setNewStepName(''); }}>Cancel</button>
            </form>
          ) : (
            <button className="task-board-add-step-btn" onClick={() => setAddingStep(true)}>
              <Plus size={16} /> Add a step
            </button>
          )}
        </div>
      )}

      {/* Completed Steps */}
      {completedSteps.length > 0 && (
        <div className="task-board-section task-board-section-completed">
          <h3 className="task-board-section-title">
            <CheckCircle2 size={14} style={{ color: 'var(--green)' }} />
            Completed Steps ({completedSteps.length})
          </h3>
          {completedSteps.map(step => (
            <StepCard
              key={step._id}
              step={step}
              expanded={expandedSteps[step._id]}
              onToggle={() => toggleStep(step._id)}
              isLeader={isLeader}
              isCompleted={true}
              onUpdateStep={onUpdateStep}
              onDeleteStep={onDeleteStep}
              onAddTask={onAddTask}
              onUpdateTask={onUpdateTask}
              onDeleteTask={onDeleteTask}
              newTaskName={newTaskNames[step._id] || ''}
              onNewTaskNameChange={(val) => setNewTaskNames(prev => ({ ...prev, [step._id]: val }))}
              addingTask={addingTask[step._id]}
              setAddingTask={(val) => setAddingTask(prev => ({ ...prev, [step._id]: val }))}
              handleAddTask={() => handleAddTask(step._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ───── Step Card ───── */
function StepCard({
  step, expanded, onToggle, isLeader, isCompleted,
  onUpdateStep, onDeleteStep, onAddTask, onUpdateTask, onDeleteTask,
  newTaskName, onNewTaskNameChange, addingTask, setAddingTask, handleAddTask,
}) {
  const pendingTasks = (step.tasks || []).filter(t => t.status === 'pending');
  const doneTasks = (step.tasks || []).filter(t => t.status === 'done');
  const totalTasks = step.tasks?.length || 0;

  return (
    <div className={`step-card ${isCompleted ? 'step-card-completed' : ''}`}>
      <div className="step-card-header" onClick={onToggle}>
        <span className="step-card-chevron">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
        <span className={`step-card-name ${isCompleted ? 'step-done-text' : ''}`}>
          {step.stepName}
        </span>
        {totalTasks > 0 && (
          <span className="step-card-count">{doneTasks.length}/{totalTasks}</span>
        )}
        {isLeader && (
          <div className="step-card-actions" onClick={e => e.stopPropagation()}>
            {!isCompleted ? (
              <button title="Mark completed" className="step-action-btn step-action-complete" onClick={() => onUpdateStep(step._id, { status: 'completed' })}>
                <Check size={14} />
              </button>
            ) : (
              <button title="Reopen step" className="step-action-btn step-action-reopen" onClick={() => onUpdateStep(step._id, { status: 'pending' })}>
                <RotateCcw size={14} />
              </button>
            )}
            <button title="Delete step" className="step-action-btn step-action-delete" onClick={() => onDeleteStep(step._id)}>
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className={`step-card-body ${isCompleted ? 'step-card-body-horizontal' : ''}`}>
          {/* Tasks */}
          {(step.tasks || []).map(task => (
            <div key={task._id} className={`task-item ${task.status === 'done' ? 'task-item-done' : ''}`}>
              {isLeader ? (
                <button
                  className={`task-checkbox ${task.status === 'done' ? 'task-checkbox-done' : ''}`}
                  onClick={() => onUpdateTask(task._id, { status: task.status === 'done' ? 'pending' : 'done' })}
                >
                  {task.status === 'done' ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                </button>
              ) : (
                <span className={`task-checkbox ${task.status === 'done' ? 'task-checkbox-done' : ''}`}>
                  {task.status === 'done' ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                </span>
              )}
              <span className={`task-name ${task.status === 'done' ? 'task-name-done' : ''}`}>
                {task.taskName}
              </span>
              {isLeader && (
                <button className="task-delete-btn" onClick={() => onDeleteTask(task._id)}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}

          {/* Add Task */}
          {isLeader && !isCompleted && (
            <div className="task-add-area">
              {addingTask ? (
                <form onSubmit={(e) => { e.preventDefault(); handleAddTask(); }} className="task-add-form">
                  <input
                    value={newTaskName}
                    onChange={e => onNewTaskNameChange(e.target.value)}
                    placeholder="Task name..."
                    autoFocus
                    maxLength={300}
                  />
                  <button type="submit" className="btn btn-primary btn-sm">Add</button>
                  <button type="button" className="btn btn-light btn-sm" onClick={() => { setAddingTask(false); onNewTaskNameChange(''); }}>✕</button>
                </form>
              ) : (
                <button className="task-add-btn" onClick={() => setAddingTask(true)}>
                  <Plus size={14} /> Add task
                </button>
              )}
            </div>
          )}

          {totalTasks === 0 && !addingTask && (
            <div className="step-empty">No tasks yet</div>
          )}
        </div>
      )}
    </div>
  );
}
