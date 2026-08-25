import React, { useState } from "react";
import { Box, Drawer, Button, Typography, TextField, Divider, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { nanoid } from "nanoid";

import LeftSideBar from "./LeftSideBar";
import { t } from '@/i18n';

const Editor = () => {
    const [blocks, setBlocks] = useState([]);
    const [selectedBlock, setSelectedBlock] = useState(null);

    const addBlock = (type) => {
        const newBlock = {
            id: nanoid(),
            name: type,
            attributes:
                type === "core/paragraph"
                    ? { content: "New paragraph block." }
                    : type === "core/image"
                        ? { url: "https://via.placeholder.com/150", alt: "Placeholder image" }
                        : { text: "New Button", url: "#" },
        };

        if (selectedBlock && selectedBlock.name === "core/container") {
            // Add as child block to the container
            const updatedBlocks = blocks.map((block) =>
                block.id === selectedBlock.id
                    ? {
                        ...block,
                        children: [...(block.children || []), newBlock],
                    }
                    : block
            );
            setBlocks(updatedBlocks);
            setSelectedBlock({ ...selectedBlock, children: [...(selectedBlock.children || []), newBlock] });
        } else {
            // Add block to the root level
            setBlocks([...blocks, newBlock]);
        }
    };


    const updateBlock = (id, updatedAttributes) => {
        // If the selected block has a parent and children, update the child block
        if (selectedBlock?.parent && selectedBlock?.parent.children) {
            const updatedChildren = selectedBlock.parent.children.map((block) => {
                if (block.id === id) {
                    return { ...block, attributes: { ...block.attributes, ...updatedAttributes } };
                }
                return block;
            });
    
            // Update the parent's children with the modified child block
            const updatedParent = { ...selectedBlock.parent, children: updatedChildren };
    
            // Update the blocks state
            const updatedBlocks = blocks.map((block) =>
                block.id === updatedParent.id ? updatedParent : block
            );
    
            setBlocks(updatedBlocks);
            const updatedSelectedBlock = updatedBlocks.find((block) => block.id === id);
            setSelectedBlock(updatedSelectedBlock);
    
        } else if (selectedBlock) {
            // If the selected block has no parent, just update the block directly
            const updatedBlocks = blocks.map((block) => {
                if (block.id === id) {
                    return { ...block, attributes: { ...block.attributes, ...updatedAttributes } };
                }
                return block;
            });
    
            setBlocks(updatedBlocks);
            const updatedSelectedBlock = updatedBlocks.find((block) => block.id === id);
            setSelectedBlock(updatedSelectedBlock);
        }
    };
    

    const parseCustomCss = (cssString) => {
        const styles = {};
        cssString.split(";").forEach((style) => {
            const [key, value] = style.split(":").map((s) => s.trim());
            if (key && value) {
                const camelCaseKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                styles[camelCaseKey] = value;
            }
        });
        return styles;
    };

    const updateParentBlocks = (parentBlock, updatedChildren) => {
        if (!parentBlock) {
            // Update root-level blocks
            setBlocks(updatedChildren);
        } else {
            // Update the children of the parent block
            const updatedBlocks = blocks.map((block) =>
                block.id === parentBlock.id
                    ? { ...block, children: updatedChildren }
                    : block
            );
            setBlocks(updatedBlocks);

            // If the parent is currently selected, update the selected block
            if (selectedBlock?.id === parentBlock.id) {
                setSelectedBlock({ ...parentBlock, children: updatedChildren });
            }
        }
    };


    const renderBlock = (block, parentBlock = null) => {
        let customStyles = {};

        if (block?.attributes?.customCss) {
            customStyles = parseCustomCss(block.attributes.customCss);
        }

        const parentChildren = parentBlock?.children || blocks;

        const index = parentChildren.findIndex((b) => b.id === block.id);

        return (
            <Box
                key={block.id} // Assigning a unique key to this block
                sx={{
                    border: selectedBlock?.id === block.id ? "2px solid var(--success)" : "none",
                    borderRadius: "4px",
                    padding: "5px",
                    marginBottom: "5px",
                    cursor: "pointer",
                    backgroundColor: "#fff",
                    position: "relative",
                }}
                onClick={(e) => {
                    e.stopPropagation(); // Prevent clicks from propagating to parent containers
                    setSelectedBlock({...block, parent: parentBlock});
                }}
            >
                {/* Render the block's content */}
                {block.name === "core/paragraph" && <Typography sx={customStyles}>{block.attributes.content}</Typography>}
                {block.name === "core/image" && (
                    <img
                        src={block.attributes.url}
                        alt={block.attributes.alt}
                        style={{ maxWidth: "100%", height: "auto", ...customStyles }}
                    />
                )}
                {block.name === "core/container" && (
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: block.attributes.direction || "row",
                            justifyContent: block.attributes.justifyContent || "flex-start",
                            alignItems: block.attributes.alignItems || "stretch",
                            gap: "8px",
                            ...customStyles,
                        }}
                    >
                        {block.children?.map((childBlock) => (
                            renderBlock(childBlock, block) // Assigning keys at each recursive level
                        ))}
                    </Box>
                )}

                {selectedBlock?.id === block.id && (
                    <Box
                        sx={{
                            position: "absolute",
                            top: -15,
                            right: 8,
                            display: "flex",
                            flexDirection: "row",
                            gap: 0.5,
                            zIndex: 10,
                            backgroundColor: 'var(--card)',
                            borderRadius: "10px",
                        }}
                    >
                        <IconButton
                            color="primary"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (index > 0) {
                                    const updatedChildren = [...parentChildren];
                                    const temp = updatedChildren[index - 1];
                                    updatedChildren[index - 1] = updatedChildren[index];
                                    updatedChildren[index] = temp;

                                    updateParentBlocks(parentBlock, updatedChildren);
                                }
                            }}
                        >
                            <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                            color="primary"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (index < parentChildren.length - 1) {
                                    const updatedChildren = [...parentChildren];
                                    const temp = updatedChildren[index + 1];
                                    updatedChildren[index + 1] = updatedChildren[index];
                                    updatedChildren[index] = temp;

                                    updateParentBlocks(parentBlock, updatedChildren);
                                }
                            }}
                        >
                            <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                            color="error"
                            onClick={(e) => {
                                e.stopPropagation();
                                const updatedChildren = parentChildren.filter((b) => b.id !== block.id);
                                updateParentBlocks(parentBlock, updatedChildren);
                            }}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Box>
                )}
            </Box>
        );
    };

    return (
        <Box display="flex" height="100vh">
            <LeftSideBar addBlock={addBlock}></LeftSideBar>

            {/* Content Area */}
            <Box
                flexGrow={1}
                p={3}
                sx={{
                    backgroundColor: "var(--surface-2)",
                    overflowY: "auto",
                }}
            >
                <Box>
                    {blocks.map((block) => (
                        renderBlock(block)
                    ))}
                </Box>
            </Box>

            {/* Right Sidebar */}
            <Drawer
                variant="permanent"
                anchor="right"
                sx={{
                    width: 240,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: { width: 240, boxSizing: "border-box" },
                }}
            >
                <Box p={2}>
                    <Typography variant="h6" gutterBottom>
                        {t("Block Options")}
                    </Typography>
                    <Divider />
                    {selectedBlock && (
                        <>
                            {selectedBlock.name === "core/paragraph" && (
                                <TextField
                                    fullWidth
                                    label={t("Content")}
                                    value={selectedBlock.attributes.content}
                                    onChange={(e) => {
                                        updateBlock(selectedBlock.id, { content: e.target.value });
                                    }}
                                    sx={{ mt: 2 }}
                                />
                            )}
                            {selectedBlock.name === "core/image" && (
                                <>
                                    <TextField
                                        fullWidth
                                        label={t("Image URL")}
                                        value={selectedBlock.attributes.url}
                                        onChange={(e) => {
                                            updateBlock(selectedBlock.id, { url: e.target.value });
                                        }}
                                        sx={{ mt:  2 }}
                                    />
                                    <TextField
                                        fullWidth
                                        label={t("Alt Text")}
                                        value={selectedBlock.attributes.alt}
                                        onChange={(e) => {
                                            updateBlock(selectedBlock.id, { alt: e.target.value });
                                        }}
                                        sx={{ mt: 2 }}
                                    />
                                </>
                            )}

                            <Typography variant="subtitle1">{t("Custom CSS")}</Typography>
                            <TextField
                                multiline
                                minRows={5}
                                placeholder={t("Enter custom CSS here...")}
                                variant="outlined"
                                fullWidth
                                style={{ marginTop: "8px" }}
                                value={selectedBlock?.attributes.customCss || ""}
                                onChange={(e) => {
                                    updateBlock(selectedBlock.id, { customCss: e.target.value });
                                }}
                            />
                        </>
                    )}
                </Box>
            </Drawer>
        </Box>
    );
};

export default Editor;
