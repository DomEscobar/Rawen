import { GeneralSettingsModel } from "../../../../shared/models/app-state.model";
import React, { useState } from "react";
import Update from "@/components/update";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

type GeneralSettingsProps = {
    viewModel: GeneralSettingsModel;
    update: (generalSettings: GeneralSettingsModel) => void;
};

const GeneralSettings: React.FC<GeneralSettingsProps> = ({ update, viewModel }) => {
    const [monitorSteps, setMonitorSteps] = useState(viewModel.monitorSteps);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSwitchChange = (_monitorSteps: boolean) => {
        setMonitorSteps(_monitorSteps);
        update({ ...viewModel, monitorSteps: _monitorSteps });
    };

    const handleModalOpen = () => {
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
    };

    return (
        <>
            <div className="flex flex-col">
                {/* <div className="flex flex-row mt-2 items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <Label>Monitor Steps</Label>
                        <div className="text-xs">
                            Takes screenshot every action and saves it into the session brain
                        </div>
                    </div>
                    <div>
                        <Switch
                            defaultChecked={monitorSteps}
                            onCheckedChange={() =>
                                handleSwitchChange(
                                    !monitorSteps
                                )
                            }
                        />
                    </div>
                    {monitorSteps && (
                        <div>
                            <Button variant="ghost" onClick={handleModalOpen}>
                                <Settings className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div> */}

                <div>
                    <Update />
                </div>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <h2>Configuration</h2>
                    </DialogHeader>
                    <div>
                        {/* Add your modal content here */}
                        <p>Configuration settings go here.</p>
                    </div>
                    <Button onClick={handleModalClose}>Close</Button>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default GeneralSettings