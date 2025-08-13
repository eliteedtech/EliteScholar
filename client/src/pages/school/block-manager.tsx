import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Plus, Settings, Trash2, Edit, Home, MapPin } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { insertSchoolBuildingSchema } from "@shared/schema";
import { useAuthStore } from "@/store/authStore";

type SchoolBuilding = {
  id: string;
  schoolId: string;
  branchId?: string;
  buildingName: string;
  buildingCode?: string;
  description?: string;
  totalFloors: number;
  rooms: Array<{
    id: string;
    name: string;
    floor: number;
    type: string;
    capacity: number;
    isActive: boolean;
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const buildingFormSchema = insertSchoolBuildingSchema.extend({
  totalRooms: z.number().min(1, "At least 1 room is required").max(100, "Maximum 100 rooms allowed"),
});

type BuildingFormData = z.infer<typeof buildingFormSchema>;

const roomEditSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Room name is required"),
  floor: z.number().min(1, "Floor must be at least 1"),
  type: z.string().min(1, "Room type is required"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  isActive: z.boolean(),
});

type RoomEditData = z.infer<typeof roomEditSchema>;

export default function BlockManager() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<SchoolBuilding | null>(null);
  const [editingRoom, setEditingRoom] = useState<RoomEditData | null>(null);

  const buildingForm = useForm<BuildingFormData>({
    resolver: zodResolver(buildingFormSchema),
    defaultValues: {
      buildingName: "",
      buildingCode: "",
      description: "",
      totalFloors: 1,
      totalRooms: 1,
    },
  });

  const roomForm = useForm<RoomEditData>({
    resolver: zodResolver(roomEditSchema),
    defaultValues: {
      id: "",
      name: "",
      floor: 1,
      type: "classroom",
      capacity: 30,
      isActive: true,
    },
  });

  // Fetch buildings
  const { data: buildings = [], isLoading } = useQuery({
    queryKey: [`/api/schools/${user?.schoolId}/buildings`],
    enabled: !!user?.schoolId,
  });

  // Create building mutation
  const createBuildingMutation = useMutation({
    mutationFn: (data: BuildingFormData) =>
      apiRequest(`/api/schools/${user?.schoolId}/buildings`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/schools/${user?.schoolId}/buildings`] });
      toast({
        title: "Success",
        description: "Building created successfully",
      });
      setShowAddDialog(false);
      buildingForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create building",
        variant: "destructive",
      });
    },
  });

  // Update building mutation
  const updateBuildingMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SchoolBuilding> }) =>
      apiRequest(`/api/buildings/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/schools/${user?.schoolId}/buildings`] });
      toast({
        title: "Success",
        description: "Building updated successfully",
      });
      setShowRoomDialog(false);
      setSelectedBuilding(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update building",
        variant: "destructive",
      });
    },
  });

  // Delete building mutation
  const deleteBuildingMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/buildings/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/schools/${user?.schoolId}/buildings`] });
      toast({
        title: "Success",
        description: "Building deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete building",
        variant: "destructive",
      });
    },
  });

  const onCreateSubmit = (data: BuildingFormData) => {
    createBuildingMutation.mutate(data);
  };

  const handleRoomSetup = (building: SchoolBuilding) => {
    setSelectedBuilding(building);
    setShowRoomDialog(true);
  };

  const handleEditRoom = (room: RoomEditData) => {
    setEditingRoom(room);
    roomForm.reset(room);
  };

  const handleSaveRoom = (data: RoomEditData) => {
    if (!selectedBuilding) return;

    const updatedRooms = selectedBuilding.rooms.map(room =>
      room.id === data.id ? { ...room, ...data } : room
    );

    updateBuildingMutation.mutate({
      id: selectedBuilding.id,
      data: { rooms: updatedRooms as any }
    });
  };

  const handleDeleteRoom = (roomId: string) => {
    if (!selectedBuilding) return;

    const updatedRooms = selectedBuilding.rooms.filter(room => room.id !== roomId);

    updateBuildingMutation.mutate({
      id: selectedBuilding.id,
      data: { rooms: updatedRooms as any }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading buildings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold" data-testid="page-title">Manage School Premises</h1>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2" data-testid="button-add-building">
              <Plus className="h-4 w-4" />
              Add Building/Block
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Building/Block</DialogTitle>
            </DialogHeader>
            <Form {...buildingForm}>
              <form onSubmit={buildingForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={buildingForm.control}
                  name="buildingName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Building Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Main Block, Science Building" {...field} data-testid="input-building-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={buildingForm.control}
                  name="buildingCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Building Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., MB, SB, AB" {...field} data-testid="input-building-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={buildingForm.control}
                  name="totalFloors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Floors</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          data-testid="input-total-floors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={buildingForm.control}
                  name="totalRooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Rooms *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          placeholder="Enter total number of rooms"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          data-testid="input-total-rooms"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={buildingForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of the building..."
                          {...field}
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                    data-testid="button-cancel-building"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createBuildingMutation.isPending}
                    data-testid="button-submit-building"
                  >
                    {createBuildingMutation.isPending ? "Creating..." : "Create Building"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Buildings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {buildings.map((building: SchoolBuilding) => (
          <Card key={building.id} className="relative" data-testid={`card-building-${building.id}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-blue-600" />
                  {building.buildingName}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRoomSetup(building)}
                    data-testid={`button-room-setup-${building.id}`}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        data-testid={`button-delete-building-${building.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Building</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{building.buildingName}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteBuildingMutation.mutate(building.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              {building.buildingCode && (
                <Badge variant="secondary" className="w-fit">
                  {building.buildingCode}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  <span>{building.totalFloors} Floor{building.totalFloors > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{building.rooms?.length || 0} Rooms</span>
                </div>
              </div>

              {building.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {building.description}
                </p>
              )}

              <div className="pt-2">
                <div className="text-xs text-gray-500">
                  Active Rooms: {building.rooms?.filter(r => r.isActive).length || 0}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {buildings.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Buildings Yet</h3>
            <p className="text-gray-500 text-center mb-4">
              Create your first building/block to start organizing your school premises.
            </p>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="flex items-center gap-2"
              data-testid="button-create-first-building"
            >
              <Plus className="h-4 w-4" />
              Add Your First Building
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Room Management Dialog */}
      <Dialog open={showRoomDialog} onOpenChange={setShowRoomDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Room Setup - {selectedBuilding?.buildingName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedBuilding?.rooms?.map((room) => (
                <Card key={room.id} className={`${!room.isActive ? 'opacity-50' : ''}`} data-testid={`card-room-${room.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{room.name}</h4>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRoom(room)}
                          data-testid={`button-edit-room-${room.id}`}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600"
                              data-testid={`button-delete-room-${room.id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Room</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{room.name}"?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteRoom(room.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <div className="text-xs space-y-1 text-gray-600">
                      <div>Floor: {room.floor}</div>
                      <div>Type: {room.type}</div>
                      <div>Capacity: {room.capacity}</div>
                      <div>Status: {room.isActive ? 'Active' : 'Inactive'}</div>
                    </div>
                  </CardContent>
                </Card>
              )) || (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No rooms available
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Room Edit Dialog */}
      {editingRoom && (
        <Dialog open={!!editingRoom} onOpenChange={() => setEditingRoom(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Room</DialogTitle>
            </DialogHeader>
            <Form {...roomForm}>
              <form onSubmit={roomForm.handleSubmit(handleSaveRoom)} className="space-y-4">
                <FormField
                  control={roomForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-room-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={roomForm.control}
                    name="floor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Floor</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            data-testid="input-room-floor"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={roomForm.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            data-testid="input-room-capacity"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={roomForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Type</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-room-type" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingRoom(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateBuildingMutation.isPending}>
                    {updateBuildingMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}