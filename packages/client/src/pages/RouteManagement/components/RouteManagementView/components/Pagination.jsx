import { motion } from "framer-motion";
import { Button } from "@components/Common/UI/Button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@lib/utils";
import PropTypes from "prop-types";

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems }) => {
  if (totalPages <= 1) return null;

  // Function to generate the array of page numbers to display
  const getPageNumbers = () => {
    // Max page buttons to show at once (excluding prev/next)
    const maxPageButtons = 5;
    let pages = [];

    // Always show first page
    pages.push(1);

    if (totalPages <= maxPageButtons) {
      // If we have fewer pages than max buttons, show all pages
      for (let i = 2; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Complex pagination with ellipsis
      if (currentPage <= 3) {
        // Near the start
        pages.push(2, 3);
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push("ellipsis");
        pages.push(totalPages - 2, totalPages - 1, totalPages);
      } else {
        // Somewhere in the middle
        pages.push("ellipsis");
        pages.push(currentPage - 1, currentPage, currentPage + 1);
        pages.push("ellipsis2");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="sticky bottom-0 left-0 right-0 mt-auto flex items-center justify-between px-6 py-4 border-t border-gray-200/50 dark:border-border/50 bg-indigo-50/50 dark:bg-card rounded-lg">
      <div className="text-sm text-gray-500 dark:text-muted-foreground">
        Showing page {currentPage} of {totalPages}
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          variant="secondary"
          size="sm"
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <div className="flex items-center gap-2">
          {getPageNumbers().map((page, index) => {
            if (page === "ellipsis" || page === "ellipsis2") {
              return (
                <div 
                  key={`ellipsis-${index}`} 
                  className="flex items-center justify-center h-8 w-8"
                >
                  <MoreHorizontal className="h-4 w-4 text-gray-400" />
                </div>
              );
            }

            return (
              <Button
                key={`page-${page}`}
                variant={currentPage === page ? "primary" : "outline"}
                size="icon"
                onClick={() => onPageChange(page)}
                className={cn(
                  "h-8 w-8 rounded-lg",
                  currentPage === page
                    ? "bg-indigo-600 dark:bg-primary text-white"
                    : "border-gray-200/50 dark:border-border/50 hover:bg-indigo-50/50 dark:hover:bg-primary/10 hover:text-indigo-600 dark:hover:text-primary hover:border-indigo-200/50 dark:hover:border-primary/20"
                )}
              >
                {page}
              </Button>
            );
          })}
        </div>
        <Button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          variant="secondary"
          size="sm"
          className="gap-1"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  totalItems: PropTypes.number.isRequired,
};

export default Pagination;
