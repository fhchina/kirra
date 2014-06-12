package com.abstratt.kirra.fixtures;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

import com.abstratt.kirra.Entity;
import com.abstratt.kirra.Instance;
import com.abstratt.kirra.InstanceManagement;
import com.abstratt.kirra.KirraException;
import com.abstratt.kirra.KirraException.Kind;
import com.abstratt.kirra.Operation;
import com.abstratt.kirra.Parameter;
import com.abstratt.kirra.Relationship;
import com.abstratt.kirra.SchemaManagement;
import com.abstratt.kirra.TypeRef;
import com.abstratt.kirra.TypeRef.TypeKind;
import com.abstratt.kirra.rest.common.Page;
import com.abstratt.kirra.rest.common.Paths;
import com.google.gson.reflect.TypeToken;

public class InMemoryInstanceManagement implements InstanceManagement {

    private final Map<TypeRef, List<Instance>> instances;
    private SchemaManagement schemaManagement;

    public InMemoryInstanceManagement(SchemaManagement schemaManagement) {
        this.instances = new HashMap<>();
        this.schemaManagement = schemaManagement;
    }

    @Override
    public synchronized Instance createInstance(Instance instance) {
        List<Instance> instances = getInstances(instance.getTypeRef());
        instance.setObjectId(generateId());

        Entity entity = schemaManagement.getEntity(instance.getTypeRef());
        entity.getProperties().stream().filter(p -> p.isHasDefault()).forEach(p -> instance.setValue(p.getName(), p.getDefaultValue()));

        instances.add(instance);
        return instance;
    }

    @Override
    public synchronized void deleteInstance(Instance instance) {
    }

    @Override
    public synchronized void deleteInstance(String namespace, String name, String id) {
    }

    @Override
    public synchronized List<?> executeOperation(Operation operation, String externalId, List<?> arguments) {
        Instance found = getInstance(operation.getOwner(), externalId);
        if (Objects.isNull(found))
            throw new KirraException("Not found", Kind.OBJECT_NOT_FOUND);
        switch (operation.getOwner().getTypeName()) {
        case "Expense":
            switch (operation.getName()) {
            case "submit":
                found.setValue("status", "Submitted");
                return Arrays.asList();
            }
        }
        throw new KirraException("Not implemented: " + operation.getName(), Kind.ELEMENT_NOT_FOUND);
    }

    @Override
    public Instance getCurrentUser() {
        // TODO Auto-generated method stub
        return null;
    }

    @Override
    public synchronized List<Operation> getEnabledEntityActions(Entity entity) {
        return null;
    }

    @Override
    public synchronized Instance getInstance(String namespace, String name, String externalId, boolean full) {
        TypeRef typeRef = new TypeRef(namespace, name, TypeKind.Entity);
        return getInstance(typeRef, externalId);
    }

    private Instance getInstance(TypeRef typeRef, String externalId) {
        List<Instance> entityInstances = getInstances(typeRef);
        return entityInstances.stream().filter(i -> i.getObjectId().equals(externalId)).findAny().orElse(null);
    }

    @Override
    public synchronized List<Instance> getInstances(String namespace, String name, boolean full) {
        TypeRef typeRef = new TypeRef(namespace, name, TypeKind.Entity);
        return getInstances(typeRef);
    }

    @Override
    public synchronized List<Instance> getParameterDomain(Entity entity, String externalId, Operation action, Parameter parameter) {
        // TODO Auto-generated method stub
        return null;
    }

    @Override
    public synchronized List<Instance> getRelatedInstances(String namespace, String name, String externalId, String relationship,
            boolean full) {
        // TODO Auto-generated method stub
        return null;
    }

    @Override
    public synchronized List<Instance> getRelationshipDomain(Entity entity, String objectId, Relationship relationship) {
        // TODO Auto-generated method stub
        return null;
    }

    @Override
    public synchronized void linkInstances(Relationship relationship, String sourceId, String destinationId) {
    }

    @Override
    public Instance newInstance(String namespace, String name) {
        return null;
    }

    @Override
    public synchronized void saveContext() {
        // TODO Auto-generated method stub

    }

    @Override
    public synchronized void unlinkInstances(Relationship relationship, String sourceId, String destinationId) {
    }

    @Override
    public synchronized Instance updateInstance(Instance instance) {
        // TODO Auto-generated method stub
        return null;
    }

    @Override
    public void validateInstance(Instance toValidate) {
    }

    @Override
    public synchronized void zap() {
        // TODO Auto-generated method stub

    }

    private String generateId() {
        return UUID.randomUUID().toString();
    }

    private List<Instance> getInstances(TypeRef typeRef) {
        return instances.computeIfAbsent(typeRef, this::loadInstances);
    }

    private List<Instance> loadInstances(TypeRef typeRef) {
        Page<Instance> entityInstances = FixtureHelper.loadFixture(new TypeToken<Page<Instance>>() {
        }.getType(), Paths.ENTITIES, typeRef.toString() + '.' + Paths.INSTANCES);
        return entityInstances == null ? new ArrayList<>() : entityInstances.contents;
    }
}
