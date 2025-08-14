import React, { useState } from "react";
import PropTypes from "prop-types";
import { Button } from "@components/Common/UI/Button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@components/Common/UI/alert-dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@components/Common/UI/Select";
import { useTheme } from "@contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { Check, FileText, Download } from "lucide-react";

const ExportPopup = ({
  onClose,
  onDownload,
  shuttles,
  departments,
  shifts,
  routes,
}) => {
  const [exportType, setExportType] = useState("all");
  const [selectedOption, setSelectedOption] = useState("");
  const [fileFormat, setFileFormat] = useState("csv");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const getOptions = () => {
    switch (exportType) {
      case "shuttle":
        return shuttles;
      case "department":
        return departments;
      case "shift":
        return shifts;
      case "route":
        return routes;
      default:
        return [];
    }
  };

  const handleDownload = () => {
    onDownload({
      exportType,
      selectedOption: selectedOption || null,
      fileFormat,
    });
  };

  return (
    <AlertDialog open onOpenChange={onClose}>
      <AlertDialogContent className={cn(
        "sm:max-w-md border overflow-hidden",
        "shadow-xl backdrop-blur-sm",
        isDark 
          ? "bg-gray-900/95 border-gray-800 text-gray-100" 
          : "bg-white border-gray-200 text-gray-900"
      )}>
        <AlertDialogHeader>
          <AlertDialogTitle className={cn(
            "flex items-center gap-2",
            isDark ? "text-gray-100" : "text-gray-900"
          )}>
            <FileText className={cn(
              "w-5 h-5",
              isDark ? "text-blue-400" : "text-blue-600" 
            )} />
            Export Data
          </AlertDialogTitle>
          <AlertDialogDescription className={isDark ? "text-gray-400" : "text-gray-500"}>
            Select the type of data to export and choose file format.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-5">
            <div>
              <label className={cn(
                "text-sm font-medium mb-3 block",
                isDark ? "text-gray-200" : "text-gray-900"
              )}>
                Export Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {["all", "route", "department", "shift", "shuttle"].map(
                  (value) => (
                    <label
                      key={value}
                      className={cn(
                        "relative flex items-center justify-start px-4 py-3 rounded-lg cursor-pointer border-2 transition-all duration-200",
                        isDark 
                          ? "hover:bg-gray-800/80" 
                          : "hover:bg-gray-50",
                        exportType === value
                          ? isDark 
                              ? "border-blue-500 bg-blue-900/20" 
                              : "border-blue-500 bg-blue-50/50"
                          : isDark 
                              ? "border-gray-700" 
                              : "border-gray-200"
                      )}
                    >
                      <input
                        type="radio"
                        name="exportType"
                        value={value}
                        checked={exportType === value}
                        onChange={(e) => {
                          setExportType(e.target.value);
                          setSelectedOption("");
                        }}
                        className="sr-only"
                      />
                      <span
                        className={cn(
                          "text-sm font-medium flex-grow",
                          exportType === value
                            ? isDark 
                                ? "text-blue-400" 
                                : "text-blue-600"
                            : isDark 
                                ? "text-gray-300" 
                                : "text-gray-700"
                        )}
                      >
                        {value.charAt(0).toUpperCase() + value.slice(1)}
                      </span>
                      {exportType === value && (
                        <div className={cn(
                          "flex items-center justify-center",
                          isDark ? "text-blue-400" : "text-blue-500"
                        )}>
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </label>
                  )
                )}
              </div>
            </div>

            {exportType !== "all" && (
              <div>
                <label className={cn(
                  "text-sm font-medium mb-2 block",
                  isDark ? "text-gray-200" : "text-gray-900"
                )}>
                  Select{" "}
                  {exportType.charAt(0).toUpperCase() + exportType.slice(1)}
                </label>
                <Select
                  value={selectedOption}
                  onValueChange={setSelectedOption}
                >
                  <SelectTrigger className={cn(
                    "w-full",
                    isDark 
                      ? "bg-gray-800 border-gray-700 text-gray-200" 
                      : "bg-white border-gray-200 text-gray-900"
                  )}>
                    <SelectValue placeholder={`Select ${exportType}`} />
                  </SelectTrigger>
                  <SelectContent className={cn(
                    "border",
                    isDark 
                      ? "bg-gray-800 border-gray-700" 
                      : "bg-white border-gray-200"
                  )}>
                    {getOptions().map((option) => (
                      <SelectItem
                        key={option.id}
                        value={option.id.toString()}
                        className={cn(
                          isDark 
                            ? "text-gray-200 focus:bg-gray-700 hover:bg-gray-700" 
                            : "text-gray-900 focus:bg-gray-100 hover:bg-gray-100"
                        )}
                      >
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className={cn(
                "text-sm font-medium mb-2 block",
                isDark ? "text-gray-200" : "text-gray-900"
              )}>
                File Format
              </label>
              <Select value={fileFormat} onValueChange={setFileFormat}>
                <SelectTrigger className={cn(
                  "w-full",
                  isDark 
                    ? "bg-gray-800 border-gray-700 text-gray-200" 
                    : "bg-white border-gray-200 text-gray-900"
                )}>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent className={cn(
                  "border",
                  isDark 
                    ? "bg-gray-800 border-gray-700" 
                    : "bg-white border-gray-200"
                )}>
                  <SelectItem
                    value="csv"
                    className={cn(
                      isDark 
                        ? "text-gray-200 focus:bg-gray-700 hover:bg-gray-700" 
                        : "text-gray-900 focus:bg-gray-100 hover:bg-gray-100"
                    )}
                  >
                    CSV
                  </SelectItem>
                  <SelectItem
                    value="excel"
                    className={cn(
                      isDark 
                        ? "text-gray-200 focus:bg-gray-700 hover:bg-gray-700" 
                        : "text-gray-900 focus:bg-gray-100 hover:bg-gray-100"
                    )}
                  >
                    Excel
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <AlertDialogFooter className={cn(
          "sm:justify-end gap-2 border-t pt-4",
          isDark ? "border-gray-700" : "border-gray-200"
        )}>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className={cn(
              isDark 
                ? "bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-200" 
                : "bg-white hover:bg-gray-100 border-gray-200"
            )}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (exportType !== "all" && !selectedOption) {
                alert("Please select an option");
                return;
              }
              handleDownload();
            }}
            className={cn(
              "gap-2",
              isDark 
                ? "bg-blue-700 hover:bg-blue-600 text-white" 
                : "bg-blue-600 hover:bg-blue-700 text-white"
            )}
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

ExportPopup.propTypes = {
  onClose: PropTypes.func.isRequired,
  onDownload: PropTypes.func.isRequired,
  shuttles: PropTypes.array.isRequired,
  departments: PropTypes.array.isRequired,
  shifts: PropTypes.array.isRequired,
  routes: PropTypes.array.isRequired,
};

export default ExportPopup;
