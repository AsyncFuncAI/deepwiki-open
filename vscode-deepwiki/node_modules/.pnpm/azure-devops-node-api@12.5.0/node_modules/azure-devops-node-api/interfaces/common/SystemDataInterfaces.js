"use strict";
//----------------------------------------------------------
// Copyright (C) Microsoft Corporation. All rights reserved.
//----------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Specifies SQL Server-specific data type of a field, property, for use in a System.Data.SqlClient.SqlParameter.
 */
var SqlDbType;
(function (SqlDbType) {
    /**
     * A 64-bit signed integer.
     */
    SqlDbType[SqlDbType["BigInt"] = 0] = "BigInt";
    /**
     * Array of type Byte. A fixed-length stream of binary data ranging between 1 and 8,000 bytes.
     */
    SqlDbType[SqlDbType["Binary"] = 1] = "Binary";
    /**
     * Boolean. An unsigned numeric value that can be 0, 1, or null.
     */
    SqlDbType[SqlDbType["Bit"] = 2] = "Bit";
    /**
     * String. A fixed-length stream of non-Unicode characters ranging between 1 and 8,000 characters.
     */
    SqlDbType[SqlDbType["Char"] = 3] = "Char";
    /**
     * DateTime. Date and time data ranging in value from January 1, 1753 to December 31, 9999 to an accuracy of 3.33 milliseconds.
     */
    SqlDbType[SqlDbType["DateTime"] = 4] = "DateTime";
    /**
     * Decimal. A fixed precision and scale numeric value between -10 38 -1 and 10 38 -1.
     */
    SqlDbType[SqlDbType["Decimal"] = 5] = "Decimal";
    /**
     * Double. A floating point number within the range of -1.79E +308 through 1.79E +308.
     */
    SqlDbType[SqlDbType["Float"] = 6] = "Float";
    /**
     * Array of type Byte. A variable-length stream of binary data ranging from 0 to 2 31 -1 (or 2,147,483,647) bytes.
     */
    SqlDbType[SqlDbType["Image"] = 7] = "Image";
    /**
     * Int32. A 32-bit signed integer.
     */
    SqlDbType[SqlDbType["Int"] = 8] = "Int";
    /**
     * Decimal. A currency value ranging from -2 63 (or -9,223,372,036,854,775,808) to 2 63 -1 (or +9,223,372,036,854,775,807) with an accuracy to a ten-thousandth of a currency unit.
     */
    SqlDbType[SqlDbType["Money"] = 9] = "Money";
    /**
     * String. A fixed-length stream of Unicode characters ranging between 1 and 4,000 characters.
     */
    SqlDbType[SqlDbType["NChar"] = 10] = "NChar";
    /**
     * String. A variable-length stream of Unicode data with a maximum length of 2 30 - 1 (or 1,073,741,823) characters.
     */
    SqlDbType[SqlDbType["NText"] = 11] = "NText";
    /**
     * String. A variable-length stream of Unicode characters ranging between 1 and 4,000 characters. Implicit conversion fails if the string is greater than 4,000 characters. Explicitly set the object when working with strings longer than 4,000 characters. Use System.Data.SqlDbType.NVarChar when the database column is nvarchar(max).
     */
    SqlDbType[SqlDbType["NVarChar"] = 12] = "NVarChar";
    /**
     * Single. A floating point number within the range of -3.40E +38 through 3.40E +38.
     */
    SqlDbType[SqlDbType["Real"] = 13] = "Real";
    /**
     * Guid. A globally unique identifier (or GUID).
     */
    SqlDbType[SqlDbType["UniqueIdentifier"] = 14] = "UniqueIdentifier";
    /**
     * DateTime. Date and time data ranging in value from January 1, 1900 to June 6, 2079 to an accuracy of one minute.
     */
    SqlDbType[SqlDbType["SmallDateTime"] = 15] = "SmallDateTime";
    /**
     * Int16. A 16-bit signed integer.
     */
    SqlDbType[SqlDbType["SmallInt"] = 16] = "SmallInt";
    /**
     * Decimal. A currency value ranging from -214,748.3648 to +214,748.3647 with an accuracy to a ten-thousandth of a currency unit.
     */
    SqlDbType[SqlDbType["SmallMoney"] = 17] = "SmallMoney";
    /**
     * String. A variable-length stream of non-Unicode data with a maximum length of 2 31 -1 (or 2,147,483,647) characters.
     */
    SqlDbType[SqlDbType["Text"] = 18] = "Text";
    /**
     * Array of type System.Byte. Automatically generated binary numbers, which are guaranteed to be unique within a database. timestamp is used typically as a mechanism for version-stamping table rows. The storage size is 8 bytes.
     */
    SqlDbType[SqlDbType["Timestamp"] = 19] = "Timestamp";
    /**
     * Byte. An 8-bit unsigned integer.
     */
    SqlDbType[SqlDbType["TinyInt"] = 20] = "TinyInt";
    /**
     * Array of type Byte. A variable-length stream of binary data ranging between 1 and 8,000 bytes. Implicit conversion fails if the byte array is greater than 8,000 bytes. Explicitly set the object when working with byte arrays larger than 8,000 bytes.
     */
    SqlDbType[SqlDbType["VarBinary"] = 21] = "VarBinary";
    /**
     * String. A variable-length stream of non-Unicode characters ranging between 1 and 8,000 characters. Use System.Data.SqlDbType.VarChar when the database column is varchar(max).
     */
    SqlDbType[SqlDbType["VarChar"] = 22] = "VarChar";
    /**
     * Object. A special data type that can contain numeric, string, binary, or date data as well as the SQL Server values Empty and Null, which is assumed if no other type is declared.
     */
    SqlDbType[SqlDbType["Variant"] = 23] = "Variant";
    /**
     * An XML value. Obtain the XML as a string using the System.Data.SqlClient.SqlDataReader.GetValue(System.Int32) method or System.Data.SqlTypes.SqlXml.Value property, or as an System.Xml.XmlReader by calling the System.Data.SqlTypes.SqlXml.CreateReader method.
     */
    SqlDbType[SqlDbType["Xml"] = 25] = "Xml";
    /**
     * A SQL Server user-defined type (UDT).
     */
    SqlDbType[SqlDbType["Udt"] = 29] = "Udt";
    /**
     * A special data type for specifying structured data contained in table-valued parameters.
     */
    SqlDbType[SqlDbType["Structured"] = 30] = "Structured";
    /**
     * Date data ranging in value from January 1,1 AD through December 31, 9999 AD.
     */
    SqlDbType[SqlDbType["Date"] = 31] = "Date";
    /**
     * Time data based on a 24-hour clock. Time value range is 00:00:00 through 23:59:59.9999999 with an accuracy of 100 nanoseconds. Corresponds to a SQL Server time value.
     */
    SqlDbType[SqlDbType["Time"] = 32] = "Time";
    /**
     * Date and time data. Date value range is from January 1,1 AD through December 31, 9999 AD. Time value range is 00:00:00 through 23:59:59.9999999 with an accuracy of 100 nanoseconds.
     */
    SqlDbType[SqlDbType["DateTime2"] = 33] = "DateTime2";
    /**
     * Date and time data with time zone awareness. Date value range is from January 1,1 AD through December 31, 9999 AD. Time value range is 00:00:00 through 23:59:59.9999999 with an accuracy of 100 nanoseconds. Time zone value range is -14:00 through +14:00.
     */
    SqlDbType[SqlDbType["DateTimeOffset"] = 34] = "DateTimeOffset";
})(SqlDbType = exports.SqlDbType || (exports.SqlDbType = {}));
exports.TypeInfo = {
    SqlDbType: {
        enumValues: {
            "BigInt": 0,
            "Binary": 1,
            "Bit": 2,
            "Char": 3,
            "DateTime": 4,
            "Decimal": 5,
            "Float": 6,
            "Image": 7,
            "Int": 8,
            "Money": 9,
            "NChar": 10,
            "NText": 11,
            "NVarChar": 12,
            "Real": 13,
            "UniqueIdentifier": 14,
            "SmallDateTime": 15,
            "SmallInt": 16,
            "SmallMoney": 17,
            "Text": 18,
            "Timestamp": 19,
            "TinyInt": 20,
            "VarBinary": 21,
            "VarChar": 22,
            "Variant": 23,
            "Xml": 25,
            "Udt": 29,
            "Structured": 30,
            "Date": 31,
            "Time": 32,
            "DateTime2": 33,
            "DateTimeOffset": 34
        }
    }
};
