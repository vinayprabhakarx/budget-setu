package com.budgetsetu.security;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * JPA AttributeConverter that automatically encrypts string entity attributes
 * before writing to PostgreSQL and decrypts them upon reading.
 */
@Converter
@Component
public class AesAttributeConverter implements AttributeConverter<String, String> {

    private static AesUtil aesUtil;

    @Autowired
    public void setAesUtil(AesUtil util) {
        AesAttributeConverter.aesUtil = util;
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) {
            return null;
        }
        if (aesUtil == null) {
            return attribute;
        }
        return aesUtil.encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        if (aesUtil == null) {
            return dbData;
        }
        return aesUtil.decrypt(dbData);
    }
}
