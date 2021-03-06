package com.abstratt.kirra;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.abstratt.kirra.TypeRef.TypeKind;

/**
 * Represents an object and its relationships.
 * <p>
 * Supports the idea of full vs. light instances. A full instance loads all
 * values for all properties and relationships available in the data repository.
 * A light instance contains only properties (and, less commonly, relationships)
 * that are marked as "essential" ({@link Repository#KIRRA_ESSENTIAL}). Note
 * that instances that are loaded due to being related to some focal instance
 * are always loaded in light mode.
 * </p>
 */
public class Instance extends Tuple {
    private static final long serialVersionUID = 1L;
    /**
     * A map of disabled action names -> reasons.
     */
    protected Map<String, String> disabledActions = new HashMap<String, String>();
    protected boolean full;
    protected Map<String, List<Instance>> links = new HashMap<String, List<Instance>>();
    protected String objectId;

    public Instance() {
    }

    public Instance(String namespace, String entity) {
        super(namespace, entity);
    }

    public Instance(TypeRef typeRef, String objectId) {
        super(typeRef);
        this.objectId = objectId;
    }

    public Map<String, String> getDisabledActions() {
        return disabledActions;
    }

    public String getEntityName() {
        return scopeName;
    }

    public String getEntityNamespace() {
        return scopeNamespace;
    }

    public Map<String, List<Instance>> getLinks() {
        return links;
    }

    public String getObjectId() {
        return objectId;
    }

    public InstanceRef getReference() {
        return new InstanceRef(scopeNamespace, scopeName, objectId);
    }

    public List<Instance> getRelated(String propertyName) {
        if (links == null)
            return null;
        return links.get(propertyName);
    }

    public Instance getSingleRelated(String reference) {
        if (links == null || !links.containsKey(reference) || links.get(reference).isEmpty())
            return null;
        return links.get(reference).get(0);
    }

    /**
     * Returns whether this instance was fully loaded.
     * 
     * @return <code>true</code> if this instance was fully loaded,
     *         <code>false</code> otherwise
     */
    public boolean isFull() {
        return full;
    }

    public boolean isInstanceOf(TypeRef type) {
        return getEntityName().equals(type.getTypeName()) && getEntityNamespace().equals(type.getEntityNamespace());
    }

    public boolean isNew() {
        return getObjectId() == null;
    }

    public void setDisabledActions(Map<String, String> disabledActions) {
        this.disabledActions = new HashMap<String, String>(disabledActions);
    }

    public void setEntityName(String entityName) {
        setScopeName(entityName);
    }

    public void setEntityNamespace(String namespace) {
        setScopeNamespace(namespace);
    }

    public void setFull(boolean full) {
        this.full = full;
    }

    public void setLinks(Map<String, List<Instance>> links) {
        this.links = new HashMap<String, List<Instance>>(links);
    }

    public void setObjectId(String objectId) {
        this.objectId = objectId;
    }

    public void setRelated(String propertyName, List<Instance> toLink) {
        links.put(propertyName, toLink);
    }

    public void setSingleRelated(String propertyName, Instance toLink) {
        setRelated(propertyName, Collections.singletonList(toLink));
    }

    @Override
    public String toString() {
        return "Instance (" + getReference() + ") - values: " + getValues() + " - links: " + links;
    }

    @Override
    protected TypeKind getTypeKind() {
        return TypeKind.Entity;
    }
}
