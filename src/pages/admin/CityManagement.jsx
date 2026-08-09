// src/pages/admin/CityManagement.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "ZA", name: "South Africa" },
];

export default function CityManagement() {
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [states, setStates] = useState([]);
  const [expandedStates, setExpandedStates] = useState({});
  const [cities, setCities] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingCities, setLoadingCities] = useState({});
  const [toast, setToast] = useState(null);
  const [showAddStateModal, setShowAddStateModal] = useState(false);
  const [newStateName, setNewStateName] = useState("");
  const [showAddCityModal, setShowAddCityModal] = useState(false);
  const [selectedStateId, setSelectedStateId] = useState(null);
  const [newCityData, setNewCityData] = useState({
    city_name: "",
    latitude: "",
    longitude: "",
  });
  const [editingCity, setEditingCity] = useState(null);
  const [editingState, setEditingState] = useState(null);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [bulkCityData, setBulkCityData] = useState("");

  // Fetch states when country changes
  useEffect(() => {
    fetchStates();
  }, [selectedCountry]);

  const fetchStates = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://operator-api-production-de23.up.railway.app/admin/states?country_code=${selectedCountry}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const data = await res.json();
      if (res.ok) {
        setStates(data.states || []);
      } else {
        showToast(data.error || "Failed to fetch states", "error");
      }
    } catch (err) {
      console.error("Error fetching states:", err);
      showToast("Failed to fetch states", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async (stateId) => {
    setLoadingCities((prev) => ({ ...prev, [stateId]: true }));
    try {
      const res = await fetch(
        `https://operator-api-production-de23.up.railway.app/admin/cities?state_id=${stateId}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const data = await res.json();
      if (res.ok) {
        setCities((prev) => ({ ...prev, [stateId]: data.cities || [] }));
      } else {
        showToast(data.error || "Failed to fetch cities", "error");
      }
    } catch (err) {
      console.error("Error fetching cities:", err);
      showToast("Failed to fetch cities", "error");
    } finally {
      setLoadingCities((prev) => ({ ...prev, [stateId]: false }));
    }
  };

  const toggleState = (stateId) => {
    setExpandedStates((prev) => {
      const isExpanded = !prev[stateId];
      if (isExpanded && !cities[stateId]) {
        fetchCities(stateId);
      }
      return { ...prev, [stateId]: isExpanded };
    });
  };

  // Add State
  const handleAddState = async () => {
    if (!newStateName.trim()) {
      showToast("State name is required", "error");
      return;
    }

    try {
      const res = await fetch(
        "https://operator-api-production-de23.up.railway.app/admin/states",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            country_code: selectedCountry,
            state_name: newStateName.trim(),
          }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        showToast(`✅ State "${newStateName}" added successfully!`, "success");
        setNewStateName("");
        setShowAddStateModal(false);
        fetchStates();
      } else {
        showToast(data.error || "Failed to add state", "error");
      }
    } catch (err) {
      console.error("Error adding state:", err);
      showToast("Failed to add state", "error");
    }
  };

  // Edit State
  const handleEditState = async (stateId, newName) => {
    if (!newName.trim()) {
      showToast("State name is required", "error");
      return;
    }

    try {
      const res = await fetch(
        `https://operator-api-production-de23.up.railway.app/admin/states/${stateId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state_name: newName.trim() }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        showToast(`✅ State updated successfully!`, "success");
        setEditingState(null);
        fetchStates();
      } else {
        showToast(data.error || "Failed to update state", "error");
      }
    } catch (err) {
      console.error("Error updating state:", err);
      showToast("Failed to update state", "error");
    }
  };

  // Delete State
  const handleDeleteState = async (stateId, stateName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${stateName}" and all its cities?`,
      )
    )
      return;

    try {
      const res = await fetch(
        `https://operator-api-production-de23.up.railway.app/admin/states/${stateId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        },
      );
      const data = await res.json();
      if (res.ok) {
        showToast(`✅ "${stateName}" deleted successfully!`, "success");
        fetchStates();
      } else {
        showToast(data.error || "Failed to delete state", "error");
      }
    } catch (err) {
      console.error("Error deleting state:", err);
      showToast("Failed to delete state", "error");
    }
  };

  // Add City
  const handleAddCity = async () => {
    if (!newCityData.city_name.trim()) {
      showToast("City name is required", "error");
      return;
    }

    try {
      const res = await fetch(
        "https://operator-api-production-de23.up.railway.app/admin/cities",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            state_id: selectedStateId,
            city_name: newCityData.city_name.trim(),
            latitude: newCityData.latitude || null,
            longitude: newCityData.longitude || null,
          }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        showToast(
          `✅ "${newCityData.city_name}" added successfully!`,
          "success",
        );
        setNewCityData({ city_name: "", latitude: "", longitude: "" });
        setShowAddCityModal(false);
        fetchCities(selectedStateId);
        fetchStates(); // Update count
      } else {
        showToast(data.error || "Failed to add city", "error");
      }
    } catch (err) {
      console.error("Error adding city:", err);
      showToast("Failed to add city", "error");
    }
  };

  // Bulk Add Cities
  const handleBulkAddCities = async () => {
    if (!bulkCityData.trim()) {
      showToast("Please enter city data", "error");
      return;
    }

    try {
      const lines = bulkCityData.split("\n").filter((line) => line.trim());
      const cities = lines.map((line) => {
        const parts = line.split(",").map((s) => s.trim());
        return {
          city_name: parts[0],
          latitude: parts[1] || null,
          longitude: parts[2] || null,
        };
      });

      const res = await fetch(
        "https://operator-api-production-de23.up.railway.app/admin/cities/bulk",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            state_id: selectedStateId,
            cities: cities,
          }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        showToast(`✅ ${data.added} cities added successfully!`, "success");
        setBulkCityData("");
        setShowBulkAddModal(false);
        fetchCities(selectedStateId);
        fetchStates();
      } else {
        showToast(data.error || "Failed to add cities", "error");
      }
    } catch (err) {
      console.error("Error bulk adding cities:", err);
      showToast("Failed to add cities", "error");
    }
  };

  // Edit City
  const handleEditCity = async (cityId, cityData) => {
    try {
      const res = await fetch(
        `https://operator-api-production-de23.up.railway.app/admin/cities/${cityId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            city_name: cityData.city_name.trim(),
            latitude: cityData.latitude || null,
            longitude: cityData.longitude || null,
          }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        showToast(`✅ City updated successfully!`, "success");
        setEditingCity(null);
        fetchCities(selectedStateId);
        fetchStates();
      } else {
        showToast(data.error || "Failed to update city", "error");
      }
    } catch (err) {
      console.error("Error updating city:", err);
      showToast("Failed to update city", "error");
    }
  };

  // Delete City
  const handleDeleteCity = async (cityId, cityName) => {
    if (!window.confirm(`Are you sure you want to delete "${cityName}"?`))
      return;

    try {
      const res = await fetch(
        `https://operator-api-production-de23.up.railway.app/admin/cities/${cityId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        },
      );
      const data = await res.json();
      if (res.ok) {
        showToast(`✅ "${cityName}" deleted successfully!`, "success");
        fetchCities(selectedStateId);
        fetchStates();
      } else {
        showToast(data.error || "Failed to delete city", "error");
      }
    } catch (err) {
      console.error("Error deleting city:", err);
      showToast("Failed to delete city", "error");
    }
  };

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-slide-in">
          <div
            className={`px-6 py-3 rounded-xl shadow-lg border ${
              toast.type === "error"
                ? "bg-red-500 border-red-400 text-white"
                : toast.type === "success"
                  ? "bg-green-500 border-green-400 text-white"
                  : "bg-blue-500 border-blue-400 text-white"
            }`}
          >
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            🏙️ City Management
          </h1>
          <p className="text-gray-500 mt-1">
            Manage states and cities for all countries
          </p>
        </div>
      </div>

      {/* Country Selector */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <label className="text-sm font-medium text-gray-700">Country:</label>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
          <button
            onClick={fetchStates}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => setShowAddStateModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition ml-auto"
          >
            + Add State
          </button>
        </div>
      </div>

      {/* States List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : states.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No states found for{" "}
            {COUNTRIES.find((c) => c.code === selectedCountry)?.name}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {states.map((state) => (
              <div key={state.id} className="bg-white">
                {/* State Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => toggleState(state.id)}
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${expandedStates[state.id] ? "rotate-90" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <span className="font-semibold text-gray-800">
                      {state.state_name}
                    </span>
                    <span className="text-sm text-gray-400">
                      ({state.city_count || 0} cities)
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {editingState === state.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          defaultValue={state.state_name}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleEditState(state.id, e.target.value);
                            }
                            if (e.key === "Escape") {
                              setEditingState(null);
                            }
                          }}
                          onBlur={(e) => {
                            if (e.target.value !== state.state_name) {
                              handleEditState(state.id, e.target.value);
                            } else {
                              setEditingState(null);
                            }
                          }}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingState(state.id)}
                          className="text-gray-400 hover:text-blue-500 transition text-sm"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteState(state.id, state.state_name)
                          }
                          className="text-gray-400 hover:text-red-500 transition text-sm"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Cities List */}
                {expandedStates[state.id] && (
                  <div className="p-4 bg-gray-50 border-t border-gray-100">
                    {loadingCities[state.id] ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="text-left p-2 font-medium text-gray-600">
                                  City Name
                                </th>
                                <th className="text-left p-2 font-medium text-gray-600">
                                  Latitude
                                </th>
                                <th className="text-left p-2 font-medium text-gray-600">
                                  Longitude
                                </th>
                                <th className="text-left p-2 font-medium text-gray-600">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {(cities[state.id] || []).map((city) => (
                                <tr
                                  key={city.id}
                                  className="border-t border-gray-200 hover:bg-gray-50"
                                >
                                  <td className="p-2 text-gray-800">
                                    {editingCity === city.id ? (
                                      <input
                                        type="text"
                                        defaultValue={city.city_name}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            handleEditCity(city.id, {
                                              city_name: e.target.value,
                                              latitude: city.latitude,
                                              longitude: city.longitude,
                                            });
                                          }
                                          if (e.key === "Escape") {
                                            setEditingCity(null);
                                          }
                                        }}
                                        onBlur={(e) => {
                                          if (
                                            e.target.value !== city.city_name
                                          ) {
                                            handleEditCity(city.id, {
                                              city_name: e.target.value,
                                              latitude: city.latitude,
                                              longitude: city.longitude,
                                            });
                                          } else {
                                            setEditingCity(null);
                                          }
                                        }}
                                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full"
                                        autoFocus
                                      />
                                    ) : (
                                      city.city_name
                                    )}
                                  </td>
                                  <td className="p-2 text-gray-600">
                                    {city.latitude || "-"}
                                  </td>
                                  <td className="p-2 text-gray-600">
                                    {city.longitude || "-"}
                                  </td>
                                  <td className="p-2">
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => setEditingCity(city.id)}
                                        className="text-gray-400 hover:text-blue-500 transition text-xs"
                                      >
                                        ✏️
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteCity(
                                            city.id,
                                            city.city_name,
                                          )
                                        }
                                        className="text-gray-400 hover:text-red-500 transition text-xs"
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Add City Buttons */}
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedStateId(state.id);
                              setNewCityData({
                                city_name: "",
                                latitude: "",
                                longitude: "",
                              });
                              setShowAddCityModal(true);
                            }}
                            className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                          >
                            + Add City
                          </button>
                          <button
                            onClick={() => {
                              setSelectedStateId(state.id);
                              setBulkCityData("");
                              setShowBulkAddModal(true);
                            }}
                            className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                          >
                            📋 Bulk Add
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add State Modal */}
      {showAddStateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Add New State
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State Name
              </label>
              <input
                type="text"
                value={newStateName}
                onChange={(e) => setNewStateName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddState();
                  if (e.key === "Escape") setShowAddStateModal(false);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter state name..."
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddStateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddState}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Add State
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add City Modal */}
      {showAddCityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Add New City
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City Name *
                </label>
                <input
                  type="text"
                  value={newCityData.city_name}
                  onChange={(e) =>
                    setNewCityData({
                      ...newCityData,
                      city_name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter city name..."
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude (optional)
                </label>
                <input
                  type="number"
                  step="any"
                  value={newCityData.latitude}
                  onChange={(e) =>
                    setNewCityData({ ...newCityData, latitude: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. 34.0522"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude (optional)
                </label>
                <input
                  type="number"
                  step="any"
                  value={newCityData.longitude}
                  onChange={(e) =>
                    setNewCityData({
                      ...newCityData,
                      longitude: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. -118.2437"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowAddCityModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCity}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Add City
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {showBulkAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Bulk Add Cities
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Enter one city per line in this format: <br />
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                City Name, Latitude, Longitude
              </code>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cities
              </label>
              <textarea
                value={bulkCityData}
                onChange={(e) => setBulkCityData(e.target.value)}
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                placeholder="Los Angeles, 34.0522, -118.2437&#10;San Francisco, 37.7749, -122.4194&#10;San Diego, 32.7157, -117.1611"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAddCities}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              >
                Add All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
