import React, { useState, useEffect } from 'react';
import './SectionManager.css';

const SectionManager = ({ exam, onSectionsUpdated }) => {
  const [sections, setSections] = useState([]);
  const [navigationRules, setNavigationRules] = useState({
    allow_forward_jump: true,
    allow_backward_navigation: true
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSectionConfig();
  }, [exam]);

  const fetchSectionConfig = async () => {
    if (!exam?.id) return;
    
    setLoading(true);
    try {
      const API_BASE = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${API_BASE}/api/teacher/exams/${exam.id}/sections`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSections(data.sections || []);
        setNavigationRules(data.navigation_rules || {
          allow_forward_jump: true,
          allow_backward_navigation: true
        });
      }
    } catch (error) {
      console.error('Error fetching section config:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSection = () => {
    const newSection = {
      id: `section-${Date.now()}`,
      name: `Section ${sections.length + 1}`,
      order: sections.length,
      oldId: null
    };
    setSections([...sections, newSection]);
  };

  const updateSection = (index, field, value) => {
    const updatedSections = [...sections];
    if (field === 'name') {
      updatedSections[index].oldId = updatedSections[index].oldId || updatedSections[index].id;
      updatedSections[index].id = value.toLowerCase().replace(/[^a-z0-9]/g, '-');
    }
    updatedSections[index][field] = value;
    setSections(updatedSections);
  };

  const deleteSection = (index) => {
    const updatedSections = sections.filter((_, i) => i !== index);
    updatedSections.forEach((section, idx) => {
      section.order = idx;
    });
    setSections(updatedSections);
  };

  const moveSection = (index, direction) => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === sections.length - 1)) {
      return;
    }

    const updatedSections = [...sections];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    [updatedSections[index].order, updatedSections[newIndex].order] = 
    [updatedSections[newIndex].order, updatedSections[index].order];
    
    updatedSections.sort((a, b) => a.order - b.order);
    setSections(updatedSections);
  };

  const saveSections = async () => {
    setSaving(true);
    try {
      const API_BASE = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${API_BASE}/api/teacher/exams/${exam.id}/sections`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          sections: sections,
          navigation_rules: navigationRules
        })
      });

      if (response.ok) {
        alert('Section configuration saved successfully!');
        if (onSectionsUpdated) {
          onSectionsUpdated();
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save sections');
      }
    } catch (error) {
      console.error('Error saving sections:', error);
      alert('Error saving sections: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateNavigationRules = async (rules) => {
    const newRules = { ...navigationRules, ...rules };
    setNavigationRules(newRules);
    
    try {
      const API_BASE = process.env.REACT_APP_BACKEND_URL;
      await fetch(`${API_BASE}/api/teacher/exams/${exam.id}/navigation-rules`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newRules)
      });
    } catch (error) {
      console.error('Error updating navigation rules:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading section configuration...</div>;
  }

  return (
    <div className="section-manager">
      <div className="section-manager-header">
        <h3>Section Management</h3>
        <p>Organize questions into sections and control navigation behavior</p>
      </div>

      {/* Navigation Rules */}
      <div className="navigation-rules-card">
        <h4>Navigation Rules</h4>
        <div className="rules-grid">
          <div className="rule-item">
            <label className="rule-toggle">
              <input
                type="checkbox"
                checked={navigationRules.allow_forward_jump}
                onChange={(e) => updateNavigationRules({
                  allow_forward_jump: e.target.checked
                })}
              />
              <span className="toggle-slider"></span>
            </label>
            <div className="rule-content">
              <strong>Allow Section Jumping</strong>
              <p>Students can jump to any section without completing the current one</p>
            </div>
          </div>

          <div className="rule-item">
            <label className="rule-toggle">
              <input
                type="checkbox"
                checked={navigationRules.allow_backward_navigation}
                onChange={(e) => updateNavigationRules({
                  allow_backward_navigation: e.target.checked
                })}
              />
              <span className="toggle-slider"></span>
            </label>
            <div className="rule-content">
              <strong>Allow Backward Navigation</strong>
              <p>Students can return to previous sections and modify answers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sections List */}
      <div className="sections-list-card">
        <div className="sections-header">
          <h4>Exam Sections</h4>
          <button onClick={addSection} className="btn-add-section">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Section
          </button>
        </div>

        {sections.length === 0 ? (
          <div className="no-sections">
            <p>No sections defined. Add sections to organize your questions.</p>
          </div>
        ) : (
          <div className="sections-container">
            {sections.sort((a, b) => a.order - b.order).map((section, index) => (
              <div key={section.id} className="section-item">
                <div className="section-controls">
                  <button 
                    onClick={() => moveSection(index, 'up')}
                    disabled={index === 0}
                    className="btn-move"
                  >
                    ↑
                  </button>
                  <button 
                    onClick={() => moveSection(index, 'down')}
                    disabled={index === sections.length - 1}
                    className="btn-move"
                  >
                    ↓
                  </button>
                </div>

                <div className="section-content">
                  <input
                    type="text"
                    value={section.name}
                    onChange={(e) => updateSection(index, 'name', e.target.value)}
                    className="section-name-input"
                    placeholder="Section name (e.g., Mathematics, Part-A)"
                  />
                  <small className="section-id">ID: {section.id}</small>
                </div>

                <div className="section-actions">
                  <button 
                    onClick={() => deleteSection(index)}
                    className="btn-delete-section"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="section-actions-footer">
          <button 
            onClick={saveSections}
            disabled={saving}
            className="btn-save-sections"
          >
            {saving ? 'Saving...' : 'Save Section Configuration'}
          </button>
        </div>
      </div>

      {/* Section Summary */}
      {sections.length > 0 && (
        <div className="section-summary">
          <h4>Section Summary</h4>
          <div className="summary-grid">
            {sections.map((section, index) => (
              <div key={section.id} className="summary-item">
                <span className="summary-order">{index + 1}</span>
                <span className="summary-name">{section.name}</span>
                <span className="summary-id">({section.id})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionManager;